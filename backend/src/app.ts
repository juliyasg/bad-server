import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import { csrfProtection } from './middlewares/csrf'
import routes from './routes'

const { PORT = 3000, ORIGIN_ALLOW = 'http://localhost' } = process.env

const app = express()

const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/auth/csrf-token',
})

const corsOptions = {
    origin: ORIGIN_ALLOW,
    credentials: true,
}

app.use(cookieParser())

app.use(cors(corsOptions))

app.use(limiter)

app.use(serveStatic(path.join(__dirname, 'public')))

app.use(urlencoded({ extended: true }))
app.use(json())

app.use(csrfProtection)

app.options('*', cors(corsOptions))

app.use(routes)

app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
