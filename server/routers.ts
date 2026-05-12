import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const LOCATION_RETENTION_DAYS = db.LOCATION_HISTORY_RETENTION_DAYS;

// COOKIE_NAME은 @shared/const에서 import됨

const isFamilyRole = (role: string | null | undefined): role is "guardian" | "child" => role === "guardian" || role === "child";

const ensureAcceptedMember = async (userId: number, familyId: number) => {
  const memberships = await db.getAcceptedFamilyMemberships(userId);
  const membership = memberships.find(member => member.familyId === familyId && member.inviteStatus === "accepted" && isFamilyRole(member.role));
  if (!membership) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Accepted family membership is required" });
  }
  return membership;
};

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async (opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      
      // 신규 사용자가 로그인했을 때 자동으로 기본 가족 생성
      const memberships = await db.getAcceptedFamilyMemberships(user.id);
      if (memberships.length === 0) {
        try {
          await db.ensurePrimaryFamily({
            name: `${user.name || "사용자"}의 가족`,
            createdByUserId: user.id,
            displayName: user.name || "사용자",
            role: "guardian",
          });
        } catch (error) {
          console.warn("Failed to create primary family:", error);
        }
      }
      
      return user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  consent: router({
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const consent = await db.getActiveLocationConsent(ctx.user.id);
      return {
        active: Boolean(consent),
        consent: consent ?? null,
      } as const;
    }),
    grant: protectedProcedure
      .input(
        z.object({
          familyId: z.number().int().positive().optional(),
          displayName: z.string().trim().min(1).max(120).optional(),
          familyRole: z.enum(["guardian", "child"]).default("guardian"),
          permissionState: z.string().trim().min(1).max(32).default("granted"),
          consentText: z.string().trim().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const fallbackName = ctx.user.name || input.displayName || "PinKids 가족";
        if (input.familyId) {
          await ensureAcceptedMember(ctx.user.id, input.familyId);
        }
        const family = input.familyId
          ? await db.getFamilyById(input.familyId)
          : await db.ensurePrimaryFamily({
              name: `${fallbackName}의 가족`,
              createdByUserId: ctx.user.id,
              displayName: input.displayName || fallbackName,
              role: input.familyRole,
            });

        const consent = await db.grantLocationConsent({
          userId: ctx.user.id,
          familyId: family?.id ?? input.familyId ?? null,
          permissionState: input.permissionState,
          ipAddress: ctx.req.ip ?? null,
          userAgent: ctx.req.headers["user-agent"] ?? null,
          consentText: input.consentText,
        });

        return {
          success: true,
          family,
          consent,
        } as const;
      }),
    revoke: protectedProcedure.mutation(async ({ ctx }) => {
      const result = await db.revokeLocationConsent(ctx.user.id);
      return {
        success: true,
        ...result,
      } as const;
    }),
  }),

  family: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(120),
          displayName: z.string().trim().min(1).max(120).optional(),
          role: z.enum(["guardian", "child"]).default("guardian"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const family = await db.createFamily({
          name: input.name,
          createdByUserId: ctx.user.id,
          displayName: input.displayName || ctx.user.name || "보호자",
          role: input.role,
        });
        return { family } as const;
      }),
    invite: protectedProcedure
      .input(
        z.object({
          familyId: z.number().int().positive(),
          displayName: z.string().trim().min(1).max(120),
          role: z.enum(["guardian", "child"]).default("child"),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
        const canInvite = memberships.some(member => member.familyId === input.familyId && member.role === "guardian" && member.canViewLocation);
        if (!canInvite) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only accepted guardians can invite family members" });
        }

        const member = await db.inviteFamilyMember(input);
        return { member } as const;
      }),
    acceptInvite: protectedProcedure
      .input(z.object({ memberId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const invite = await db.getFamilyMemberById(input.memberId);
        if (!invite || invite.inviteStatus !== "pending" || (invite.userId !== null && invite.userId !== ctx.user.id)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only pending, unclaimed family invitations can be accepted" });
        }
        const member = await db.acceptFamilyInvite(input.memberId, ctx.user.id);
        return { member } as const;
      }),
    myMemberships: protectedProcedure.query(async ({ ctx }) => {
      const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
      return { memberships } as const;
    }),
  }),

  location: router({
    updateCurrent: protectedProcedure
      .input(
        z.object({
          familyId: z.number().int().positive().optional(),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
          accuracy: z.number().min(0).max(100000).nullable().optional(),
          recordedAt: z.number().int().positive().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
        const familyId = input.familyId ?? memberships[0]?.familyId ?? null;
        if (!familyId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Accepted family membership is required before sharing location" });
        }
        const membership = memberships.find(member => member.familyId === familyId && member.inviteStatus === "accepted" && isFamilyRole(member.role));
        if (!membership || !membership.canShareLocation) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only accepted guardian or child members with sharing permission can update location" });
        }
        const location = await db.upsertLocationPoint({
          userId: ctx.user.id,
          familyId,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy: input.accuracy ?? null,
          recordedAt: input.recordedAt,
        });
        return { location } as const;
      }),
    getFamilyLocations: protectedProcedure.query(async ({ ctx }) => {
      const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
      const canViewAnyFamily = memberships.some(member => member.inviteStatus === "accepted" && member.role === "guardian" && member.canViewLocation);
      if (memberships.length === 0) {
        return { locations: [], retentionDays: LOCATION_RETENTION_DAYS } as const;
      }
      if (!canViewAnyFamily) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only accepted guardians with viewing permission can read family locations" });
      }
      const locations = await db.getLatestFamilyLocations(ctx.user.id);
      return { locations, retentionDays: LOCATION_RETENTION_DAYS } as const;
    }),
    pauseSharing: protectedProcedure.mutation(async ({ ctx }) => {
      const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
      const canPause = memberships.some(member => member.inviteStatus === "accepted" && isFamilyRole(member.role) && member.canShareLocation);
      if (!canPause) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only accepted guardian or child members with sharing permission can pause location sharing" });
      }
      const result = await db.pauseLocationSharing(ctx.user.id);
      return { success: true, ...result } as const;
    }),
    deleteHistory: protectedProcedure.mutation(async ({ ctx }) => {
      const memberships = await db.getAcceptedFamilyMemberships(ctx.user.id);
      const canDelete = memberships.some(member => member.inviteStatus === "accepted" && isFamilyRole(member.role) && member.canShareLocation);
      if (!canDelete) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only accepted guardian or child members with sharing permission can delete their location history" });
      }
      const result = await db.deleteLocationHistory(ctx.user.id);
      return { success: true, ...result } as const;
    }),
  }),
  invites: router({
    create: protectedProcedure
      .input(
        z.object({
          familyId: z.number().int().positive(),
          role: z.enum(["guardian", "child"]),
          canViewLocation: z.boolean().default(false),
          canShareLocation: z.boolean().default(false),
          expiresInHours: z.number().int().positive().default(24),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const membership = await ensureAcceptedMember(ctx.user.id, input.familyId);
        if (membership.role !== "guardian") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only guardians can create invite links" });
        }
        const link = await db.createInviteLink({
          familyId: input.familyId,
          createdByUserId: ctx.user.id,
          role: input.role,
          canViewLocation: input.canViewLocation,
          canShareLocation: input.canShareLocation,
          expiresInHours: input.expiresInHours,
        });
        return { link } as const;
      }),
    accept: protectedProcedure
      .input(
        z.object({
          token: z.string().min(1),
          displayName: z.string().min(1).max(120),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const member = await db.acceptInviteLink({
          token: input.token,
          userId: ctx.user.id,
          displayName: input.displayName,
        });
        return { member } as const;
      }),
    getValid: publicProcedure
      .input(
        z.object({
          token: z.string().min(1),
        }),
      )
      .query(async ({ input }) => {
        const link = await db.getValidInviteLink(input.token);
        if (!link) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invite link" });
        }
        return { link } as const;
      }),
    getFamilyLinks: protectedProcedure
      .input(
        z.object({
          familyId: z.number().int().positive(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const links = await db.getFamilyInviteLinks(input.familyId, ctx.user.id);
        return { links } as const;
      }),
    revoke: protectedProcedure
      .input(
        z.object({
          linkId: z.number().int().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await db.revokeInviteLink(input.linkId, ctx.user.id);
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
