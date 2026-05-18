export interface HealthStatusResponse {
  status: 'ok';
  service: string;
  env: string;
  frontendOrigin: string;
}
