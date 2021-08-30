import { User } from "../entities/User";
import { Arg, Mutation, Resolver } from "type-graphql";
import argon2d from "argon2";
import { UserMutationResponse } from "../types/UserMutationResponse";
import { RegisterInput } from "../types/RegisterInput";

@Resolver()
export class UserResolver {
  @Mutation(_returns => UserMutationResponse, { nullable: true })
  async register(
    @Arg('registerInput') { username, email, password }: RegisterInput,
  ): Promise<UserMutationResponse> {
    try {
      const existingUSer = await User.findOne({
        where: [{ username }, { email }]
      })
      if (existingUSer) return {
        code: 400,
        success: false,
        message: 'Duplicated username or email',
        errors: [
          {
            field: existingUSer.username === username ? 'username' : 'email',
            message: `${existingUSer.username === username ? 'Username' : 'Email'} already taken`
          }
        ]
      };

      const hashedPassword = await argon2d.hash(password)

      const newUser = User.create({
        username,
        password: hashedPassword,
        email
      })

      return {
        code: 200,
        success: true,
        message: 'User registration successful',
        user: await User.save(newUser)
      }
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Internal server error ${error.message}`,
      };
    }
  }
}