import { AggregateRoot } from '../../../../shared/domain';
import { UserRegisteredEvent } from '../events/UserRegisteredEvent';
import { UserLoggedInEvent } from '../events/UserLoggedInEvent';
import { UserLoggedOutEvent } from '../events/UserLoggedOutEvent';
import { UserProfileUpdatedEvent } from '../events/UserProfileUpdatedEvent';
import { PasswordChangedEvent } from '../events/PasswordChangedEvent';

export interface UserProps {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export class User extends AggregateRoot {
  private readonly _id: string;
  private _email: string;
  private _username: string;
  private _firstName?: string;
  private _lastName?: string;
  private _avatar?: string;
  private _version: number = 0;

  constructor(
    id: string,
    email: string,
    username: string,
    createdAt: Date,
    updatedAt: Date,
    firstName?: string,
    lastName?: string,
    avatar?: string
  ) {
    super(createdAt, updatedAt);
    this._id = id;
    this._email = email;
    this._username = username;
    this._firstName = firstName;
    this._lastName = lastName;
    this._avatar = avatar;
    
    this.addDomainEvent(new UserRegisteredEvent(this._id, this._email));
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get username(): string {
    return this._username;
  }

  get firstName(): string | undefined {
    return this._firstName;
  }

  get lastName(): string | undefined {
    return this._lastName;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  public updateProfile(updateData: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): void {
    if (updateData.email) this._email = updateData.email;
    if (updateData.username) this._username = updateData.username;
    if (updateData.firstName) this._firstName = updateData.firstName;
    if (updateData.lastName) this._lastName = updateData.lastName;
    if (updateData.avatar) this._avatar = updateData.avatar;

    this.updateTimestamp();
    this.incrementVersion();
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, this._email));
  }

  public login(): void {
    this.updateTimestamp();
    this.addDomainEvent(new UserLoggedInEvent(this._id, this._email));
  }

  public logout(): void {
    this.updateTimestamp();
    this.addDomainEvent(new UserLoggedOutEvent());
  }

  public changePassword(): void {
    this.updateTimestamp();
    this.incrementVersion();
    this.addDomainEvent(new PasswordChangedEvent());
  }

  public getVersion(): number {
    return this._version;
  }

  public incrementVersion(): void {
    this._version++;
  }

  public toJSON(): object {
    return {
      id: this._id,
      email: this._email,
      username: this._username,
      firstName: this._firstName,
      lastName: this._lastName,
      avatar: this._avatar,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this._version
    };
  }
} 