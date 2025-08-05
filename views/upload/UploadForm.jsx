const React = require('react')

const UploadForm = () => {
  const handleImageUpload = async (e) => {
    e.preventDefault()
    
    const formData = new FormData()
    const fileInput = document.getElementById('imageFile')
    formData.append('file', fileInput.files[0])

    try {
      const response = await fetch('/upload/image', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Upload successful! Image URL: ${result.url}`)
        // You can store the URL in your database here
        console.log('Upload result:', result)
      } else {
        alert('Upload failed: ' + result.msg)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    }
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    
    const formData = new FormData()
    const fileInput = document.getElementById('videoFile')
    formData.append('file', fileInput.files[0])

    try {
      const response = await fetch('/upload/video', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`Video upload successful! Video URL: ${result.url}`)
        console.log('Video upload result:', result)
      } else {
        alert('Video upload failed: ' + result.msg)
      }
    } catch (error) {
      console.error('Video upload error:', error)
      alert('Video upload failed')
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>File Upload Test</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Upload Image</h2>
        <form onSubmit={handleImageUpload}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="file" 
              id="imageFile" 
              accept="image/*" 
              required 
              style={{ marginBottom: '10px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
            Upload Image
          </button>
        </form>
      </div>

      <div>
        <h2>Upload Video</h2>
        <form onSubmit={handleVideoUpload}>
          <div style={{ marginBottom: '10px' }}>
            <input 
              type="file" 
              id="videoFile" 
              accept="video/*" 
              required 
              style={{ marginBottom: '10px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
            Upload Video
          </button>
        </form>
      </div>
    </div>
  )
}

module.exports = UploadForm 