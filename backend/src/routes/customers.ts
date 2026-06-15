import { Router } from 'express'
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, { roleGuardMiddleware } from '../middlewares/auth'
import { Role } from '../models/user'
import {
    validateCustomerIdParam,
    validateCustomerQuery,
    validateCustomerUpdateBody,
} from '../middlewares/validations'

const customerRouter = Router()

customerRouter.use(auth)
customerRouter.use(roleGuardMiddleware(Role.Admin))

customerRouter.get('/', validateCustomerQuery, getCustomers)
customerRouter.get('/:id', validateCustomerIdParam, getCustomerById)
customerRouter.patch(
    '/:id',
    validateCustomerIdParam,
    validateCustomerUpdateBody,
    updateCustomer
)
customerRouter.delete('/:id', validateCustomerIdParam, deleteCustomer)

export default customerRouter
