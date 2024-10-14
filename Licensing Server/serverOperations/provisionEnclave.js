const k8s = require('@kubernetes/client-node');

async function provisionEnclave(username) {
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();  

  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  const namespace = 'default';  


  const podManifest = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'enclave',  
      labels: {
        app: 'enclave',
        client: username,
      },
    },
    spec: {
      containers: [
        {
          name: 'enclave-container',
          image: 'younes0204/enclave-container', 
          env:[
            {
              name: "JWT_SECRET_KEY",
              valueFrom:{
                secretKeyRef:{
                  name: "jwt-secret",
                  key: "JWT_SECRET_KEY"
                }
              }
            }
          ],
          ports: [
            {
              containerPort: 8082,  
            },
          ],
          volumeMounts: [
            {
              mountPath: "/etc/tls",
              name: "enclave-tls",
              readOnly: true,
            }
          ]
        },
      ],
      volumes: [
        {
          name: "enclave-tls",
          secret: {
            secretName: "enclave-tls"
          }
        }
      ]
    },
  };

  try {

    const existingPods = await k8sApi.listNamespacedPod(namespace);
    const podExists = existingPods.body.items.some(pod => pod.metadata.name === podManifest.metadata.name);

    if (podExists) {
      console.log(`Enclave pod already exists: ${podManifest.metadata.name}`);
      return `Enclave pod already exists: ${podManifest.metadata.name}`;  
    }


    const response = await k8sApi.createNamespacedPod(namespace, podManifest);
    console.log(`Enclave pod created: ${response.body.metadata.name}`);
    return response.body.metadata.name;  
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

module.exports = provisionEnclave;
