import helper from '@/js/utils/helper.js'

const electron = window.require('electron')
const { ipcRenderer } = electron

const getParticipant = ({ workspaceId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('get-participant', arg)
    ipcRenderer.once('get-participant-cb', (event, arg) => { resolve(arg) })
  })
}

const participantConfirm = ({ declined, inviteCode }) => {
  return new Promise((resolve, reject) => {
    const params = { declined, inviteCode }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('participant-confirm', arg)
    ipcRenderer.once('participant-confirm-cb', (event, arg) => { resolve(arg) })
  })
}

const inviteParticipant = ({ workspaceId, identifier, isEditable, notificationType }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId, identifier, isEditable, notificationType }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('invite-participant', arg)
    ipcRenderer.once('invite-participant-cb', (event, arg) => { resolve(arg) })
  })
}

const editParticipant = ({ userId, workspaceId, isEditable }) => {
  return new Promise((resolve, reject) => {
    const params = { userId, workspaceId, isEditable }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('edit-participant', arg)
    ipcRenderer.once('edit-participant-cb', (event, arg) => { resolve(arg) })
  })
}

const removeParticipant = ({ userId, workspaceId }) => {
  return new Promise((resolve, reject) => {
    const params = { userId, workspaceId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('remove-participant', arg)
    ipcRenderer.once('remove-participant-cb', (event, arg) => { resolve(arg) })
  })
}

const leaveWorkspace = ({ workspaceId }) => {
  return new Promise((resolve, reject) => {
    const params = { workspaceId }
    const arg = helper.apiRequestData(params)
    ipcRenderer.send('leave-workspace', arg)
    ipcRenderer.once('leave-workspace-cb', (event, arg) => { resolve(arg) })
  })
}

export { getParticipant, participantConfirm, inviteParticipant, editParticipant, removeParticipant, leaveWorkspace }
