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

export async function exportPDF(analysisData) {
  const response = await axios.post('/export', analysisData, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'onboarding-report.pdf')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
