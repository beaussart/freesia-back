import { Component, Inject, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import Optional from 'typescript-optional';
import { UserRegisterDto } from './dto/user.register.dto';
import { ROLE_USER } from './authorityes/authority.constants';
import { Authority } from './authorityes/authority.entity';
import { AuthObject } from './authorityes/authObject.entity';
import { DELETE, EDIT, READ } from '../auth/constant';

@Component()
export class UserService {
    private readonly logger = new Logger('UserService', true);

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(AuthObject) private readonly authObjectRepository: Repository<AuthObject>,
    ) {}

    async findAll(): Promise<User[]> {
        return await this.userRepository.find();
    }

    async findById(id: number): Promise<Optional<User>> {
        const user = await this.userRepository.findOne({ id });
        return Optional.ofNullable(user);
    }

    async findByEmail(email: string): Promise<Optional<User>> {
        const user = await this.userRepository.findOne({ email });
        return Optional.ofNullable(user);
    }

    getHashString(passwd: string): string {
        return bcrypt.hashSync(passwd, 10);
    }

    doPasswordMatch(passwd: string, user: User): boolean {
        return bcrypt.compareSync(passwd, user.password);
    }

    save(user: User): Promise<User> {
        return this.userRepository.save(user);
    }

    async saveDto(userDto: UserRegisterDto): Promise<User> {
        const user = new User();
        user.email = userDto.email;
        user.firstName = userDto.firstName;
        user.lastName = userDto.lastName;
        user.email = userDto.email.toLocaleLowerCase();
        user.password = this.getHashString(userDto.password);
        user.authority = [new Authority(ROLE_USER)];
        await this.save(user);
        const authObj = await this.authObjectRepository.save(
            new AuthObject('User', user.id, [READ, EDIT, DELETE], user),
        );
        user.authObjects = [authObj];
        return user;
    }
}