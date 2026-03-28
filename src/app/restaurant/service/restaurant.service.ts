import {Knex} from "knex";
import {db} from "../../../common/knex/knex";
import {UnAuthorisedError} from "../../../common/auth/errors";
import {RestaurantNotFoundError} from "../errors";
import {RegisterRestaurantDTO} from "../../auth/dto/auth.dto";
import {SystemRole} from "../../user/enums";
import {UserService, userService} from "../../user/service/user.service";
import {RestaurantEntity} from "../entity/restaurant.entity";
import {CreateRestaurantDTO, UpdateRestaurantDTO, UpdateRestaurantStatusDTO} from "../dto/restaurant.dto";
import {RestaurantStatus} from "../enums";
import {createRestaurant, findAllRestaurants, findRestaurantById, updateRestaurant, updateRestaurantStatus} from "../repository/restaurant.repo";

export class RestaurantService {
    constructor(private readonly userService: UserService) {}

    createWithOwner = async (userRole: SystemRole, data: CreateRestaurantDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }

        const now = new Date();
        const trx = await db.transaction();

        try {
            const user = await this.userService.create({
                email: data.owner.email,
                phone: data.owner.phone,
                name: data.owner.name,
                password: data.owner.password,
                systemRole: SystemRole.RESTAURANT_USER,
            }, trx);

            const restaurant = await createRestaurant(new RestaurantEntity({
                ownerId: user.id,
                name: data.name,
                logoURL: data.logoUrl ?? "",
                primaryCountry: data.primaryCountry,
                status: RestaurantStatus.ACTIVE,
                createdAt: now,
                updatedAt: now,
                statusUpdatedAt: now,
            }), trx);

            // lazy-import to avoid circular dependency
            const {memberService} = require("../../rbac/service/member.service");
            await memberService.createOwnerMember(restaurant.id, user.id, trx);

            await trx.commit();

            return {
                restaurant,
                owner: {
                    id: user.id,
                    email: user.email,
                    phone: user.phone,
                    name: user.name,
                    systemRole: user.systemRole,
                },
            };
        } catch (error) {
            await trx.rollback();
            throw error;
        }
    }

    create = async (userId: number, data: RegisterRestaurantDTO, trx: Knex)=> {
        const now = new Date();
        const restaurant = new RestaurantEntity({
            ownerId: userId,
            name: data.name,
            logoURL: data.logoURL,
            primaryCountry: data.primaryCountry,
            status: RestaurantStatus.PENDING,
            createdAt: now,
            updatedAt: now,
            statusUpdatedAt: now
        })
        const result = await createRestaurant(restaurant, trx);

        return result;
    }

    findAll = async() => {
        const result = await findAllRestaurants();
        return result;
    }

    findById = async(id: number) => {
        const restaurant = await findRestaurantById(id);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }
        return restaurant;
    }

    update = async(id: number, userId: number, userRole: SystemRole, data: UpdateRestaurantDTO) => {
        const restaurant = await findRestaurantById(id);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }
        if (userRole !== SystemRole.SYSTEM_ADMIN && Number(restaurant.ownerId) !== Number(userId)) {
            throw UnAuthorisedError;
        }
        return await updateRestaurant(id, data);
    }

    updateStatus = async(id: number, userRole: SystemRole, data: UpdateRestaurantStatusDTO) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) {
            throw UnAuthorisedError;
        }
        const restaurant = await findRestaurantById(id);
        if (!restaurant) {
            throw RestaurantNotFoundError;
        }
        return await updateRestaurantStatus(id, data.status);
    }
}

export const restaurantService = new RestaurantService(userService);
