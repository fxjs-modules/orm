import Axios from 'axios'

export function rpc (methodName, params) {
  return Axios.post(`/rpc`, {
    id: Date.now(),
    method: methodName,
    params: params
  })
    .then(res => {
      const data = res.data

      if (data.error)
        throw data.error

      return data.result
    })
}