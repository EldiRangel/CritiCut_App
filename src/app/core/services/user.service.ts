import { Injectable, inject, signal } from '@angular/core';

import { STORAGE_KEYS } from '../constants/app.constants';
import { SEED_USERS } from '../data/seed.data';
import type { User } from '../models/user.model';
import { StorageService } from './storage.service';

/** CRUD de usuarios sobre la base local. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly storage = inject(StorageService);
  private readonly usersSignal = signal<User[]>([]);
  private initPromise: Promise<void> | null = null;

  readonly users = this.usersSignal.asReadonly();

  init(): Promise<void> {
    this.initPromise ??= this.load();
    return this.initPromise;
  }

  getAll(): User[] {
    return this.usersSignal();
  }

  getById(id: string): User | undefined {
    return this.usersSignal().find((user) => user.id === id);
  }

  findByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    return this.usersSignal().find((user) => user.email.toLowerCase() === normalized);
  }

  async add(user: User): Promise<User> {
    this.usersSignal.update((users) => [...users, user]);
    await this.persist();
    return user;
  }

  async update(
    id: string,
    changes: Partial<Omit<User, 'id' | 'createdAt'>>
  ): Promise<User | undefined> {
    let updated: User | undefined;
    this.usersSignal.update((users) =>
      users.map((user) => {
        if (user.id !== id) {
          return user;
        }
        updated = { ...user, ...changes, updatedAt: new Date().toISOString() };
        return updated;
      })
    );
    if (updated) {
      await this.persist();
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.usersSignal.update((users) => users.filter((user) => user.id !== id));
    await this.persist();
  }

  private async load(): Promise<void> {
    const stored = await this.storage.get<User[]>(STORAGE_KEYS.users);
    if (stored && stored.length > 0) {
      this.usersSignal.set(stored);
      return;
    }
    this.usersSignal.set([...SEED_USERS]);
    await this.persist();
  }

  private persist(): Promise<void> {
    return this.storage.set(STORAGE_KEYS.users, this.usersSignal());
  }
}
