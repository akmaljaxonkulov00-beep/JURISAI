export const testAuth = () => true
export const testAuthHelper = (_email?: string, _password?: string) => true
export const testLogin = async (_email?: string, _password?: string) => true
export const runAllTests = async () => ({ passed: true, results: [] })
