import { createBrowserHistory } from 'history'

const history = createBrowserHistory()

const navigationService = {
  push(path: string): void {
    history.push(path)
  },
}

export default navigationService
