import { request } from "@/shared/api/client";
import { endpoints } from "@/shared/api/endpoints";
import { ApiError } from "@/shared/api/errors";
import type { Page } from "@/shared/api/types";
import { SUGGESTIONS_PAGE_LIMIT } from "@/shared/config/constants";
import {
  extractDiscoveredUsers,
  extractTotalPages,
  normalizeUser,
} from "../model/user.normalize";
import type { User } from "../model/user.types";

export const usersApi = {
  /**
   * The primary profile route disappeared behind a 404 at some point, so the
   * legacy one is used as a fallback. Any other failure propagates.
   */
  async getCurrentUser(): Promise<User | null> {
    const candidates = [endpoints.users.me, endpoints.users.meFallback];

    for (const url of candidates) {
      try {
        const data = await request({ method: "GET", url });
        const user = normalizeUser(data);
        if (user) return user;
      } catch (error) {
        if (error instanceof ApiError && error.isNotFound) continue;
        throw error;
      }
    }

    return null;
  },

  async getUserProfile(userId: string, viewerId: string | null): Promise<User | null> {
    const data = await request({ method: "GET", url: endpoints.users.profile(userId) });
    return normalizeUser(data, viewerId);
  },

  async toggleFollow(userId: string): Promise<void> {
    await request({ method: "PUT", url: endpoints.users.follow(userId) });
  },

  async uploadProfilePhoto(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("photo", file);
    await request({ method: "PUT", url: endpoints.users.uploadPhoto, data: formData });
  },

  async uploadCoverPhoto(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("cover", file);
    await request({ method: "PUT", url: endpoints.users.uploadCover, data: formData });
  },

  async getDiscoveryPage(
    mode: "search" | "suggestions",
    page: number,
    searchTerm: string,
  ): Promise<Page<unknown>> {
    const isSearch = mode === "search";
    const offset = (page - 1) * SUGGESTIONS_PAGE_LIMIT;

    const data = await request({
      method: "GET",
      url: isSearch ? endpoints.users.search : endpoints.users.suggestions,
      params: isSearch
        ? { limit: SUGGESTIONS_PAGE_LIMIT, page, q: searchTerm.trim() }
        : {
            limit: SUGGESTIONS_PAGE_LIMIT,
            page,
            skip: offset,
            offset,
          },
    });

    return {
      items: extractDiscoveredUsers(data),
      page,
      totalPages: extractTotalPages(data),
      totalCount: null,
    };
  },
};
