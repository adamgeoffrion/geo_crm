import { create, CLIENT_ERROR, SERVER_ERROR, TIMEOUT_ERROR, CONNECTION_ERROR,
	NETWORK_ERROR, CANCEL_ERROR } from 'apisauce'

const initialState = {
	baseUrl: '',
	status: 'SEND',
	queue: [],
	retry: 3000,
	kmap: [],
	setTokenExpired: null
}

let state = initialState
let api = null
let timer = 0
let baseURL = ''

const setState = (st = initialState) => state = st

const createAPI = (baseurl, apistate = initialState) => {
	baseURL = baseurl
	setState(apistate)
	api = create({
		baseURL: baseurl,
		headers: { Accept: 'application/json' },
		timeout: 3000
	})
}

const add = (msg, resume, retry = true) => {
	msg.retry = retry
	msg.promise = new Promise((resolve, reject) => {
		state.queue.push({resolve: resolve, reject: reject, msg: msg})
	})
	execute(msg)
	return msg
}

const execute = async (msg) => {
	let response = await send(msg)
	if (msg.retry === false) updateTimeout(DEFAULT_TIMEOUT)
	if (response.ok) {
		handleSuccess(response)
		return
	}
	else {
		if (handleFail(response)) {
			return
		}
	}
}

const	send = msg => {
	const { method, payload, endPoint } = msg
	console.log(endPoint)
	api.setHeader('Authorization', 'Bearer ' + state.token)
	if (method === 'POST') return api.post(endPoint, payload)
	if (method === 'GET') return api.get(endPoint, payload)
	if (method === 'PUT') return api.put(endPoint, payload)
	if (method === 'DELETE') return api.delete(endPoint, payload)
}

const handleSuccess = response => {
	const { msg } = state.queue[0]
	if (response.data && ('Token' in response.data)) {
		state.token = response.data.Token
		new EncryptedAsyncStorage().setItem(Constants.USER_TOKEN, response.data.Token)
	}
	// setRetry()
	// state.kmap = updateMap(state.kmap, msg, response.data)
	state.queue[0].resolve(response)
	state.queue.shift()
}

const handleFail = response => {
	const { msg } = state.queue[0]
	console.log(response)
	switch (response.problem) {
	case CLIENT_ERROR:
	case SERVER_ERROR:
		console.log('Call failed, removing from queue ', state.queue[0].msg, response)
		// setRetry()
		state.queue[0].reject(response)
		state.queue.shift()
		return true

	case TIMEOUT_ERROR:
	case CONNECTION_ERROR:
	case NETWORK_ERROR:
	case CANCEL_ERROR:
		if (msg.retry === false) {
			// setRetry()
			state.queue[0].reject(response)
			state.queue.shift()
			return true
		}
		// setRetry((state.retry * 2) > 8000 ? 8000 : (state.retry*2))
		if (msg.retryCount == null) {
			msg.retryCount = 1
		}
		else if (msg.retryCount >= 5) {
			// setRetry()
			state.queue[0].reject(response)
			state.queue.shift()
			return true
		}
		else {
			msg.retryCount++
		}
		if (('onRetrying' in msg) && (typeof msg.onRetrying === 'function')) {
			msg.onRetrying(msg.retryCount, response.problem, state.retry)
		}
		//console.log(response.problem + ' Call failed, retrying in ' + state.retry)
	}
	return false
}

const API = {
	createAPI,
	add
}

export default API
