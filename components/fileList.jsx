import React, { useEffect } from 'react'
import { View, Text, Button, Linking, StyleSheet, FlatList } from 'react-native'
import { useFiles } from './FileContext'
import {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { s3Client } from '../sdk/S3Client'

const FileList = () => {
  const bucketName = process.env.EXPO_PUBLIC_BUCKET_NAME
  const { files, setFiles } = useFiles()

  const fetchFiles = async () => {
    try {
      const command = new ListObjectsV2Command({ Bucket: bucketName })
      const data = await s3Client.send(command)
      setFiles(data?.Contents || [])
    } catch (err) {
      console.error('Error retrieving file list:', err)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  const handleDownload = async (fileName) => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      })

      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

      Linking.openURL(url)

      console.log('This file successfully opened:', fileName)
    } catch (err) {
      console.error('Error opening file:', err)
    }
  }

  const handleDelete = async (fileName) => {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      })

      await s3Client.send(command)
      console.log('File successfully deleted:', fileName)

      // Update the local state instead of fetching all files again
      setFiles((prevFiles) => prevFiles.filter((file) => file.Key !== fileName))
    } catch (err) {
      console.error('Error deleting file:', err)
    }
  }
  const renderItem = ({ item }) => (
    <View style={styles.fileRow}>
      <Button title="📷" onPress={() => handleDownload(item.Key)} />
      <Text>{item.Key}</Text>
      <Button title="X" color="red" onPress={() => handleDelete(item.Key)} />
    </View>
  )
  
  return (
    <View style={styles.container}>
      <FlatList
        data={files}
        renderItem={renderItem}
        keyExtractor={(item) => item.Key}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
  })
  

export default FileList