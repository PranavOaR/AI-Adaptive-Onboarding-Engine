import axios from 'axios'

const API_BASE = '/analyze'

export async function runAnalysis(resumeFile, jdFile, jdText) {
  const formData = new FormData()
  formData.append('resume_file', resumeFile)

  if (jdFile) {
    formData.append('jd_file', jdFile)
  }
  if (jdText) {
    formData.append('jd_text', jdText)
  }

  const response = await axios.post(API_BASE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}
