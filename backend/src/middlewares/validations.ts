import { NextFunction, Request, Response } from 'express'
import Joi, { ObjectSchema } from 'joi'
import { Types } from 'mongoose'
import BadRequestError from '../errors/bad-request-error'

type RequestPart = 'body' | 'params' | 'query'

type ValidationSchema = Partial<Record<RequestPart, ObjectSchema>>

const validate =
    (schema: ValidationSchema) =>
    (req: Request, _res: Response, next: NextFunction) => {
        const options = {
            abortEarly: false,
            stripUnknown: true,
        }

        const requestParts = Object.keys(schema) as RequestPart[]

        const validationError = requestParts
            .map((part) => {
                const { error, value } = schema[part]!.validate(
                    req[part],
                    options
                )

                if (!error) {
                    req[part] = value
                }

                return error
            })
            .find(Boolean)

        if (validationError) {
            return next(
                new BadRequestError(
                    validationError.details
                        .map((detail) => detail.message)
                        .join(', ')
                )
            )
        }

        return next()
    }

export const phoneRegExp = /^\+?[0-9\s()-]{6,20}$/
export const noHtmlTagsRegExp = /^(?!.*<[^>]*>).*$/

const noHtmlString = (fieldName: string) =>
    Joi.string().pattern(noHtmlTagsRegExp).messages({
        'string.pattern.base': `Поле "${fieldName}" не должно содержать HTML-теги`,
    })

export enum PaymentType {
    Card = 'card',
    Online = 'online',
}

export enum SortOrder {
    Asc = 'asc',
    Desc = 'desc',
}

export enum OrderStatus {
    Cancelled = 'cancelled',
    Completed = 'completed',
    New = 'new',
    Delivering = 'delivering',
}

const paginationQuerySchema = {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
}

const dateSchema = Joi.date().iso()

const objectIdSchema = Joi.string().custom((value, helpers) => {
    if (Types.ObjectId.isValid(value)) {
        return value
    }
    return helpers.message({ any: 'Невалидный id' })
})

// валидация id
export const validateOrderBody = validate({
    body: Joi.object().keys({
        items: Joi.array()
            .items(
                Joi.string().custom((value, helpers) => {
                    if (Types.ObjectId.isValid(value)) {
                        return value
                    }
                    return helpers.message({ custom: 'Невалидный id' })
                })
            )
            .messages({
                'array.empty': 'Не указаны товары',
            }),
        payment: Joi.string()
            .valid(...Object.values(PaymentType))
            .required()
            .messages({
                'string.valid':
                    'Указано не валидное значение для способа оплаты, возможные значения - "card", "online"',
                'string.empty': 'Не указан способ оплаты',
            }),
        email: Joi.string().email().required().messages({
            'string.empty': 'Не указан email',
        }),
        phone: Joi.string().max(20).required().pattern(phoneRegExp).messages({
            'string.empty': 'Не указан телефон',
        }),
        address: noHtmlString('address').max(300).required().messages({
            'string.empty': 'Не указан адрес',
            'string.pattern.base': 'Поле "address" не должно содержать HTML-теги',
        }),
        total: Joi.number().required().messages({
            'string.empty': 'Не указана сумма заказа',
        }),
        comment: noHtmlString('comment').max(1000).optional().allow(''),
    }),
})

// валидация товара.
// name и link - обязательные поля, name - от 2 до 30 символов, link - валидный url
export const validateProductBody = validate({
    body: Joi.object().keys({
        title: noHtmlString('title').required().min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.empty': 'Поле "title" должно быть заполнено',
            'string.pattern.base': 'Поле "title" не должно содержать HTML-теги',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required(),
            originalName: Joi.string().required(),
        }),
        category: noHtmlString('category').max(100).required().messages({
            'string.empty': 'Поле "category" должно быть заполнено',
            'string.pattern.base': 'Поле "category" не должно содержать HTML-теги',
        }),
        description: noHtmlString('description').max(5000).required().messages({
            'string.empty': 'Поле "description" должно быть заполнено',
            'string.pattern.base': 'Поле "description" не должно содержать HTML-теги',
        }),
        price: Joi.number().allow(null),
    }),
})

export const validateProductUpdateBody = validate({
    body: Joi.object().keys({
        title: noHtmlString('title').min(2).max(30).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.pattern.base': 'Поле "title" не должно содержать HTML-теги',
        }),
        image: Joi.object().keys({
            fileName: Joi.string().required(),
            originalName: Joi.string().required(),
        }),
        category: noHtmlString('category').max(100),
        description: noHtmlString('description').max(5000),
        price: Joi.number().allow(null),
    }),
})

export const validateObjId = validate({
    params: Joi.object().keys({
        productId: Joi.string()
            .required()
            .custom((value, helpers) => {
                if (Types.ObjectId.isValid(value)) {
                    return value
                }
                return helpers.message({ any: 'Невалидный id' })
            }),
    }),
})

export const validateUserBody = validate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).pattern(noHtmlTagsRegExp).messages({
            'string.min': 'Минимальная длина поля "name" - 2',
            'string.max': 'Максимальная длина поля "name" - 30',
            'string.pattern.base': 'Поле "name" не должно содержать HTML-теги',
        }),
        password: Joi.string().min(6).required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.empty': 'Поле "email" должно быть заполнено',
            }),
    }),
})

export const validateAuthentication = validate({
    body: Joi.object().keys({
        email: Joi.string()
            .required()
            .email()
            .message('Поле "email" должно быть валидным email-адресом')
            .messages({
                'string.required': 'Поле "email" должно быть заполнено',
            }),
        password: Joi.string().required().messages({
            'string.empty': 'Поле "password" должно быть заполнено',
        }),
    }),
})

export const validateProductQuery = validate({
    query: Joi.object().keys({
        ...paginationQuerySchema,
    }),
})

export const validateCustomerQuery = validate({
    query: Joi.object().keys({
        ...paginationQuerySchema,
        sortField: Joi.string()
            .valid('createdAt', 'totalAmount', 'orderCount', 'lastOrderDate')
            .default('createdAt'),
        sortOrder: Joi.string()
            .valid(...Object.values(SortOrder))
            .default(SortOrder.Desc),
        registrationDateFrom: dateSchema,
        registrationDateTo: dateSchema,
        lastOrderDateFrom: dateSchema,
        lastOrderDateTo: dateSchema,
        totalAmountFrom: Joi.number().min(0),
        totalAmountTo: Joi.number().min(0),
        orderCountFrom: Joi.number().integer().min(0),
        orderCountTo: Joi.number().integer().min(0),
        search: Joi.string().max(100),
    }),
})

export const validateOrderQuery = validate({
    query: Joi.object().keys({
        ...paginationQuerySchema,
        sortField: Joi.string()
            .valid('createdAt', 'totalAmount', 'orderNumber', 'status')
            .default('createdAt'),
        sortOrder: Joi.string()
            .valid(...Object.values(SortOrder))
            .default(SortOrder.Desc),
        status: Joi.string()
            .valid(...Object.values(OrderStatus)),
        totalAmountFrom: Joi.number().min(0),
        totalAmountTo: Joi.number().min(0),
        orderDateFrom: dateSchema,
        orderDateTo: dateSchema,
        search: Joi.string().max(100),
    }),
})

export const validateCurrentUserOrdersQuery = validate({
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(5),
        search: Joi.string().max(100),
    }),
})

export const validateCustomerIdParam = validate({
    params: Joi.object().keys({
        id: objectIdSchema.required(),
    }),
})

export const validateOrderIdParam = validate({
    params: Joi.object().keys({
        id: objectIdSchema.required(),
    }),
})

export const validateOrderNumberParam = validate({
    params: Joi.object().keys({
        orderNumber: Joi.number().integer().min(1).required(),
    }),
})

export const validateCustomerUpdateBody = validate({
    body: Joi.object().keys({
        name: Joi.string().min(2).max(30).pattern(noHtmlTagsRegExp),
        phone: Joi.string().max(20).pattern(phoneRegExp),
    }),
})

export const validateOrderUpdateBody = validate({
    body: Joi.object().keys({
        status: Joi.string()
            .valid(...Object.values(OrderStatus))
            .required(),
    }),
})
