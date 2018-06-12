import API from './API'

const listUsers = () => API.add({
	method: 'GET',
	endPoint: 'demo/all',
})

const UserAPI = {
	listUsers
}

export default UserAPI
