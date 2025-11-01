import type { User } from "../generated/client/client";

export const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  statusMessage: user.statusMessage,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

