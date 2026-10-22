const offlineEnglish = new URL(location.href).searchParams.get('lang') === 'en'
const offlineCopy = offlineEnglish
    ? {
          heading: 'Saved articles',
          description:
              'Only public articles explicitly saved in this browser are available.',
          empty: 'No saved articles. Connect and use “Save offline” on an article.',
          loading: 'Loading saved articles…',
          error: 'Offline storage is unavailable. Check this browser’s storage settings and reconnect.',
          online: 'Connected · Saved copies may differ from the latest article.',
          offline: 'Offline · Only saved articles are available.',
          remove: 'Delete',
          clear: 'Delete all',
          confirm: 'Delete every saved article from this browser?',
          notice: 'Browser data deletion or storage eviction may remove these copies.',
      }
    : {
          heading: '저장한 글',
          description: '이 브라우저에서 직접 저장한 공개 글만 볼 수 있습니다.',
          empty: '저장한 글이 없습니다. 인터넷 연결 후 글에서 ‘오프라인 저장’을 눌러 주세요.',
          loading: '저장한 글을 불러오는 중…',
          error: '오프라인 저장소를 사용할 수 없습니다. 브라우저 저장 설정과 연결을 확인해 주세요.',
          online: '인터넷 연결됨 · 저장본은 최신 원문과 다를 수 있습니다.',
          offline: '오프라인 · 저장한 글만 볼 수 있습니다.',
          remove: '삭제',
          clear: '전체 삭제',
          confirm: '이 브라우저에 저장한 글을 모두 삭제할까요?',
          notice: '브라우저 데이터 삭제·저장 공간 정리 시 저장본도 사라질 수 있습니다.',
      }

function offlineMessage(worker, action, path) {
    return new Promise((resolve, reject) => {
        const channel = new MessageChannel()
        const timer = setTimeout(() => {
            channel.port1.close()
            reject(new Error('timeout'))
        }, 8000)
        channel.port1.onmessage = (event) => {
            clearTimeout(timer)
            channel.port1.close()
            if (event.data?.ok) resolve(event.data.articles)
            else reject(new Error('storage'))
        }
        worker.postMessage({ channel: 'heap-forge-offline-v1', action, path }, [
            channel.port2,
        ])
    })
}

async function offlineLibrary() {
    document.documentElement.lang = offlineEnglish ? 'en' : 'ko'
    for (const id of ['heading', 'description', 'notice'])
        document.getElementById(id).textContent = offlineCopy[id]
    const status = document.getElementById('status')
    const clear = document.getElementById('clear')
    clear.textContent = offlineCopy.clear
    const connection = () => {
        document.getElementById('connection').textContent = navigator.onLine
            ? offlineCopy.online
            : offlineCopy.offline
    }
    connection()
    addEventListener('online', connection)
    addEventListener('offline', connection)
    status.textContent = offlineCopy.loading
    try {
        const registered = await navigator.serviceWorker.getRegistration('/')
        const worker = registered?.active
        if (!worker) {
            status.textContent = offlineCopy.empty
            return
        }
        const render = (articles) => {
            const list = document.getElementById('articles')
            list.replaceChildren()
            status.textContent = articles.length ? '' : offlineCopy.empty
            clear.hidden = articles.length === 0
            for (const article of articles) {
                const item = document.createElement('li')
                const body = document.createElement('div')
                const link = document.createElement('a')
                link.href = `/offline.html?article=${encodeURIComponent(article.path)}`
                link.textContent = article.title
                const time = document.createElement('time')
                time.dateTime = article.savedAt
                time.textContent = new Date(article.savedAt).toLocaleString(
                    offlineEnglish ? 'en' : 'ko'
                )
                body.append(link, time)
                const remove = document.createElement('button')
                remove.type = 'button'
                remove.textContent = offlineCopy.remove
                remove.setAttribute(
                    'aria-label',
                    `${offlineCopy.remove}: ${article.title}`
                )
                remove.onclick = async () => {
                    remove.disabled = true
                    try {
                        render(
                            await offlineMessage(worker, 'delete', article.path)
                        )
                    } catch {
                        status.textContent = offlineCopy.error
                        remove.disabled = false
                    }
                }
                item.append(body, remove)
                list.append(item)
            }
        }
        render(await offlineMessage(worker, 'list'))
        clear.onclick = async () => {
            if (!confirm(offlineCopy.confirm)) return
            clear.disabled = true
            try {
                render(await offlineMessage(worker, 'clear'))
            } catch {
                status.textContent = offlineCopy.error
            } finally {
                clear.disabled = false
            }
        }
    } catch {
        status.textContent = offlineCopy.error
    }
}
void offlineLibrary()
