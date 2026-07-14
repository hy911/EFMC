import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * 获取 Payload Local API 实例。
 * Payload 内部对同一 config 做了单例缓存，重复调用零开销；
 * RSC / Route Handler 里直接 await getPayloadClient() 即可，无 HTTP 往返。
 */
export const getPayloadClient = () => getPayload({ config })
