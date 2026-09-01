export interface MetricSyncFile {
  name: string
  value: unknown
}

export interface MetricDirectoryHandle {
  getFileHandle(name: string, options?: { create?: boolean }): Promise<MetricFileHandle>
}

interface MetricFileHandle {
  createWritable(): Promise<MetricWritableFile>
}

interface MetricWritableFile {
  write(contents: string): Promise<void>
  close(): Promise<void>
}

interface FileSystemAccessWindow extends Window {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<MetricDirectoryHandle>
}

function serializeJson(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`
}

async function writeDirectoryFiles(directory: MetricDirectoryHandle, files: MetricSyncFile[]) {
  await Promise.all(files.map(async (file) => {
    const fileHandle = await directory.getFileHandle(file.name, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(serializeJson(file.value))
    await writable.close()
  }))
}

function downloadFiles(files: MetricSyncFile[]) {
  for (const file of files) {
    const blob = new Blob([serializeJson(file.value)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = file.name
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

export async function syncMetricJsonFiles(files: MetricSyncFile[], currentDirectory?: MetricDirectoryHandle) {
  const windowWithAccess = window as FileSystemAccessWindow
  const directory = currentDirectory ?? (windowWithAccess.showDirectoryPicker ? await windowWithAccess.showDirectoryPicker({ mode: 'readwrite' }) : undefined)

  if (directory) {
    await writeDirectoryFiles(directory, files)
    return { mode: 'directory' as const, directory }
  }

  downloadFiles(files)
  return { mode: 'download' as const, directory: undefined }
}
