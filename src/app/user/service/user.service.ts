import {UserNotFoundError} from "../errors";
import {findUserById} from "../repository/users.repo";

export class UserService {

    getByUserId = async (userId:number) => {
        const user = await findUserById(userId);
        if(!user) {
            throw UserNotFoundError
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            systemRole: user.systemRole,
        }
    }
}
export const userService = new UserService();