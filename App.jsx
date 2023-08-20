import React from 'react'
import { StyleSheet, View, SafeAreaView } from 'react-native'
import FileUploader from './components/S3Uploader'
import FileList from './components/fileList'

import 'react-native-url-polyfill/auto'
import 'react-native-get-random-values'

import { FileProvider } from './components/FileContext'

const Separator = () => <View style={styles.separator} />

const App = () => (
  <SafeAreaView style={styles.container}>
    <View style={{ flex: 1, paddingTop: 1 }}>
      <FileProvider>
        <FileUploader />
        <Separator />
        <FileList />
      </FileProvider>
    </View>
    <Separator />
  </SafeAreaView>
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  separator: {
    marginVertical: 8,
    borderBottomColor: '#737373',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
})

export default App
