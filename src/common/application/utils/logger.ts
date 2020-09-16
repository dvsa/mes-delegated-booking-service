export function info(msg: string): void {
  console.log(`INFO: ${msg}`);
}

export function warn(msg: string): void {
  console.warn(`WARN: ${msg}`);
}

export function error(msg: string): void {
  console.error(`ERROR: ${msg}`);
}

export function customMetric(name: string, description: string): void {
  console.log(JSON.stringify({
    name,
    description,
    service: 'journal-service',
  }));
}
