/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
import { apiThrottle } from '#start/limiter'

const CreateSessionsController = () => import('#controllers/create_sessions_controller')
const TerminateSessionsController = () => import('#controllers/terminate_sessions_controller')
const SendMessagesController = () => import('#controllers/send_messages_controller')

router
  .group(() => {
    // Session management
    router.post('/create-session/', [CreateSessionsController]).use(apiThrottle)

    // router.get('/sessions/:deviceId', '#controllers/whatsapp_controller.getSession')
    router.delete('/delete-session', [TerminateSessionsController])

    // Messages
    router.post('/send-messages', [SendMessagesController]).use(apiThrottle)

    // router.get('/devices/:deviceId/messages', '#controllers/whatsapp_controller.getMessages')

    // Devices
    // router.get('/devices', '#controllers/whatsapp_controller.getDevices')
    // router.get('/devices/:deviceId', '#controllers/whatsapp_controller.getDevice')
  })
  .prefix('/api/v1')
