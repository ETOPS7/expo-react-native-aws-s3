import React, { useState, useEffect } from 'react'
import { s3Client } from '../sdk/S3Client'
import { PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { useFiles } from './FileContext'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { Button, View, Text, Image, StyleSheet } from 'react-native'

const FileUploader = () => {
  const bucketName = process.env.EXPO_PUBLIC_BUCKET_NAME
  const [file, setFile] = useState(null)

  const { files, setFiles } = useFiles()
  const [uploading, setUploading] = useState(false)
  const [bucketStatus, setBucketStatus] = useState(null)
  const [image, setImage] = useState(null)

  useEffect(() => {
    const checkBucketStatus = async () => {
      try {
        const command = new HeadBucketCommand({ Bucket: bucketName })
        await s3Client.send(command)
        setBucketStatus('Bucket is available')
      } catch (err) {
        setBucketStatus('Bucket is not available')
      }
    }

    checkBucketStatus()
  }, [])

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'],
      })

      if (result.canceled) {
        console.log('User cancelled the picker')
        return
      }

      const selectedFile = result.assets[0]
      console.log('Document selected:', selectedFile)

      // Convert URI to Blob
      const response = await fetch(selectedFile.uri)
      const blob = await response.blob()

      setFile({
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
        content: blob,
      })
    } catch (err) {
      console.error('Error picking document:', err)
    }
  }

  const uriToBlob = async (uri) => {
    const response = await fetch(uri)
    return await response.blob()
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0]
      const blob = await uriToBlob(selectedImage.uri)
      setFile({
        uri: selectedImage.uri,
        name: selectedImage.fileName || `${Date.now()}.jpg`,
        type: 'image/jpeg',
        content: blob,
      })
      setImage(selectedImage.uri)
    }
  }

  const handleUpload = async () => {
    if (!file || uploading || bucketStatus !== 'Bucket is available') return

    if (files.some((existingFile) => existingFile.Key === file.name)) {
      console.warn('A file with that name already exists:', file.name)
      return
    }

    setUploading(true)

    const params = {
      Bucket: bucketName,
      Key: file.name,
      Body: file.content, // Blob or Base64
      ContentType: file.type,
    }

    try {
      const command = new PutObjectCommand(params)
      await s3Client.send(command)
      setFiles((prevFiles) => [...prevFiles, { Key: file.name }])
      console.log('File successfully uploaded:', file.name)
      setFile(null)
    } catch (err) {
      console.error('Error uploading:', err)
    } finally {
      setUploading(false)
      setImage(null)
    }
  }

  return (
    <View style={{ flex: 1, alignItems: 'center', padding: 20 }}>
      <Text
        style={{
          color: bucketStatus === 'Bucket is available' ? 'green' : 'red',
          alignSelf: 'flex-start', // Это выравнивает текст влево
        }}
      >
        {bucketStatus}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: 30,
        }}
      >
        <View style={{ alignItems: 'flex-start' }}>
          <Button title="📁 Choose File" onPress={pickDocument} />
          <Button
            title="🖼️ Choose Image"
            onPress={pickImage}
            style={{ marginTop: 10 }}
          />
        </View>

        <Button
          title={uploading ? '🔄 Uploading...' : ' ⬆️ Upload'}
          onPress={handleUpload}
          disabled={uploading || bucketStatus !== 'Bucket is available'}
        />
      </View>

      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 200, height: 200, margin: 20 }}
        />
      )}

      {file && !image && (
        <View style={styles.filePreview}>
          <Button title="X" onPress={() => setFile(null)} />
          <Text>
            {file.name} ~ {(file.content.size / (1024 * 1024)).toFixed(2)}mb
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    width: '100%',
  },
})

export default FileUploader
