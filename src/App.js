import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import UserAPI from './services/api/UserAPI'
import API from './services/api/API'

API.createAPI('http://localhost:8080/')

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      users: []
    }
  }

  componentDidMount() {
    UserAPI.listUsers().promise.then(result => {
      this.setState({users: result.data})
    }).catch(error => {
      console.log('Error')
      console.log(error)
    })
  }

  render() {
    const { users } = this.state
    let results = []
    users.forEach(user => {
      results.push(
        <View key={user.username}>
          <Text>{'id: ' + user.id}</Text>
          <Text>{'username: ' + user.username}</Text>
          <Text>{'first: ' + user.firstName}</Text>
          <Text>{'last: ' + user.lastName}</Text>
        </View>
      )
    })
    return (
      <View style={styles.container}>
        <Text>Users:</Text>
        {results}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
