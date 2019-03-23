import cors from 'cors'
import helmet from 'helmet'
import routes from './routes'
const env = require('sugar-env')
import bodyParser from 'body-parser'
import middlewares from './middlewares'
import express, { Express } from 'express'
import { makeConfig, IExpressoAppConfig } from './config'

interface ITransformerFunction {
  (app: Express, config: IExpressoAppConfig, environment: string): void
}

/**
 * Creates express app and registers boilerplate middlewares
 * @param transformer - Custom app configuration function
 */
export function app (transformer: ITransformerFunction) {
  /**
   * @param options - Expresso config options object, wich can be extended with additional properties
   * @param environment - Current sugar-env environment string
   */
  return async <TOptions extends Partial<IExpressoAppConfig>> (options: TOptions, environment: string) => {
    if (environment !== env.TEST) {
      process.on('unhandledRejection', (err) => {
        console.error(err)
        process.exit(1)
      })
    }

    const config = makeConfig(options, environment)

    const app = express()

    app.use(middlewares.deeptrace.factory(config.deeptrace))
    app.use(helmet())
    app.use(cors(config.cors))
    app.use(bodyParser.json())
    app.use(middlewares.onBehalfOf.factory())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(middlewares.morgan.factory(config.morgan, environment))

    app.get('/ping', routes.ping.factory(config))
    app.get('/teapot', routes.teapot.factory())

    await transformer(app, config, environment)

    app.use('*', routes.unmatched.factory())

    return app
  }
}

export default app
