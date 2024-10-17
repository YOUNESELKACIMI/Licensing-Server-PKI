# Licensing Server: Safeguarding User Authentication and Enclave Creation

# **Part 1: Defining an Architecture for Secure Licensing Server and Enclave Authentication**

---

**Problem Definition:**
The goal is to design a **Licensing Server** that securely authenticates users and provisions enclaves, which are secure computational environments. The server must handle user authentication (via username and password) and manage the deployment of enclave instances with a **PKI (Public Key Infrastructure)** for secure communication.

Additionally, the **Licensing Server** must include the enclave's TLS certificate in its **TPM quote** to provide proof of enclave integrity to the client. The client verifies the **quote** and enclave certificate before establishing a secure communication channel.

---

### **1.1 Hypothesis and Assumptions**

- **PKI Infrastructure**: We will utilize **X.509 certificates** to ensure secure communication between the Licensing Server, enclaves, and clients. Cert-manager will be used for automating certificate issuance and renewal within the Kubernetes cluster.
- **TPM-Based Attestation**: The Licensing Server will communicate with the **TPM** (Trusted Platform Module) to securely store and attest the enclave’s certificate hash.
- **Kubernetes Environment**: The Licensing Server will run in a Kubernetes environment, automatically provisioning enclave pods upon user authentication. Kubernetes will ensure scalability and isolated execution of enclaves.
- **User Authentication**: Users will authenticate using their **username and password**. The Licensing Server will validate credentials and handle the creation of an enclave.
- **gRPC Communication**: Secure and efficient communication between the Licensing Server Components will be established using **gRPC**.
- RESTful API Communication: Secure and efficient communication between the licensing Server, clients and enclaves using RESTful APIs.

### **1.2 Key Components**

- **Licensing Server**: This server is responsible for:
    - Verifying user credentials.
    - Provisioning enclaves dynamically.
    - Managing certificates via Cert-manager.
    - Communicating with the TPM for attestation and quote generation.
- **Kubernetes Cluster**: Responsible for orchestrating enclave deployments as pods, ensuring scalability and isolation.
- **Cert-manager**: Automates TLS certificate issuance and renewal for the enclaves.
- **TPM (Trusted Platform Module)**: Provides a hardware-backed mechanism to generate attestation quotes, storing the enclave certificate hash.
- **Client**: Interacts with the Licensing Server to authenticate, obtain the quote, and verify the enclave’s integrity before establishing secure communication.

---

### **1.3 Cryptographic Algorithms and Mechanisms**

- **X.509 Certificates**: The enclaves will use X.509 certificates issued by the CA via Cert-manager to enable secure TLS communication.
- **RSA/ECDSA Key Pairs**: These asymmetric encryption algorithms will be used to create the public-private key pairs for TLS certificates. RSA is widely supported, though **ECDSA** can be used for better performance and security.
- **SHA-256 Hashing Algorithm**: The **SHA-256** cryptographic hash function will be used to hash the enclave’s TLS certificate. This hash will be included in the **TPM quote**.
- **TLS (Transport Layer Security)**: Ensures that all communication between the client and the enclave is encrypted and secure.
- **TPM Quotes**: The **TPM** provides a hardware-backed quote containing a signed hash of the enclave’s TLS certificate. The Licensing Server will return the TPM quote and public attestation key to the client for verification.

---

### **1.4 High-Level Solution Architecture**

![sequence.png](/Readme_imgs/sequence.png)

### **Step 1: Client Authentication**

- **Client Request**: The client sends a username and password to the Licensing Server to authenticate.
- **Licensing Server Verification**: The Licensing Server verifies the credentials against its database(Postgres database in our case)

### **Step 2: Enclave Provisioning**

- **Kubernetes Enclave Creation**: Upon successful authentication, the Licensing Server requests Kubernetes to provision an enclave pod.
- **TLS Certificate Assignment**: Cert-manager issues a unique TLS certificate for the enclave, which is mounted into the pod as a Kubernetes secret.

### **Step 3: TPM-Based Attestation**

- **TPM Interaction**: The Licensing Server interacts with the TPM to generate a **TPM quote** that includes the enclave’s certificate hash.
- **Quote Generation**: The TPM creates the quote and signs it using the enclave’s attestation key.

### **Step 4: Quote Delivery to Client**

- **Licensing Server Response**: The Licensing Server sends the **TPM quote**, the enclave’s public attestation key, and the enclave’s TLS certificate back to the client.

### **Step 5: Client Verification and Connection**

- **Quote Verification**: The client verifies the TPM quote by comparing the enclave’s TLS certificate hash with the hash provided in the quote.
- **Establishing Secure Communication**: If the verification is successful, the client initiates a secure TLS connection with the enclave.

---

### **1.5 Kubernetes Deployment and Infrastructure**

![Architecture.png](/Readme_imgs/Architecture.png)

### **Licensing Server**:

- **Kubernetes Microservice**: The Licensing Server runs as a microservice in the Kubernetes cluster, managing user authentication and enclave deployment.

### **Enclave Pod**:

- **Pod Lifecycle Management**: The Licensing Server provisions and manages enclave pods via Kubernetes.
- **TLS Certificates**: Cert-manager automates the issuing of TLS certificates for enclave pods, ensuring secure communication.

### **Cert-manager Integration**:

- **Automated Certificate Management**: Cert-manager will manage the lifecycle of TLS certificates, handling renewals and secure storage using **Kubernetes Secrets**.

---

### **1.6 Steps to Develop and Deploy the Architecture**

1. **PKI Setup**:
    - Deploy the **Certificate Authority (CA)** for issuing certificates.
    - Install **Cert-manager** in the Kubernetes cluster to automate certificate management.
2. **Licensing Server Development**:
    - Implement the Licensing Server to:
        - Authenticate users.
        - Request enclave provisioning.
        - Communicate with TPM for attestation.
3. **Kubernetes Cluster Configuration**:
    - Set up a **Kubernetes cluster** with APIs for managing enclave pods.
    - Implement pod manifest templates for deploying enclave instances with TLS support.
4. **gRPC and RESTful APIs Implementation**:
    - Implement **gRPC** services for communication between the Licensing Server components.
    - Implement RESTful communication between the Licensing Server, clients and enclave.
5. **TPM Integration**:
    - Develop TPM-related functionality to generate quotes and store certificate hashes.

---

# **Part 2: Implementation in kubernetes and Security Enhancements**

---

### **2.1 Implementation in kubernetes**

![Ressources Architecture.png](/Readme_imgs/Ressources_Architecture.png)

the Licensing Server is split into two containers, each handling distinct operations within the same pod. This setup facilitates separation of concerns, improves security, and scales appropriately in a Kubernetes environment. Each part of the system is containerized and integrated into the Kubernetes architecture, using **gRPC** and **RESTful APIs** for communication.

### **1. Licensing Server Architecture**

- **Container 1: Server Operations**
    
    This container handles internal operations such as enclave provisioning, interaction with TPM, and communication with the client operations container via **gRPC**.
    
- **Container 2: Client Operations**
    
    This container interacts with external clients via **REST APIs**. It communicates with the server operations container to initiate actions like authentication, signup, and enclave provisioning on behalf of the user.
    

### **2. Dockerizing the Licensing Server**

- **Server Operations Container**:
    - Implemented in **Node.js**, this container provides the **gRPC** services to handle enclave provisioning, TPM quote generation, and certificate management.
    - It communicates with the enclave pods and performs the necessary security checks before providing access to clients.
- **Client Operations Container**:
    - Also implemented in **Node.js**, this container exposes **REST APIs** for user signup, login, and token management.
    - Upon successful authentication, the server signs a **JSON Web Token (JWT)**, which the client uses to access the enclave.
    - It communicates with the **PostgreSQL** database for storing user credentials and uses **gRPC** to talk to the Server Operations container for further actions like enclave provisioning.

### **3. PostgreSQL Database Pod**

- A separate pod is deployed as a **PostgreSQL database service** for managing user authentication and storing credentials securely.
    - The **Client Operations** container communicates with this database to handle user signup and login requests.
    - Passwords are stored securely using **bcrypt** hashing for safe user management.

### **4. Enclave Pod Provisioning**

- **Enclave Pod**:
    - A separate pod that is provisioned upon successful authentication by the Server Operations container.
    - This pod is dynamically created in response to requests from authenticated users.
    - Each enclave is exposed as a **Kubernetes service** with an ingress route, allowing clients to interact with the enclave securely over REST APIs.
- **Cert-manager Integration**:
    - Cert-manager handles the issuance of **TLS certificates** for secure communication between the client and the enclave. Certificates are mounted as Kubernetes secrets in each enclave pod.
    
    ### Create the Cert-Manager Pod
    
    - **CRDs**: Allow Cert-Manager to extend Kubernetes with new resource types for managing certificates.
    - **Controller**: Contains the logic and processes needed to issue and manage those certificates trough Let’s Encrypt.
    
    ```powershell
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.crds.yaml
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
    ```
    

### **5. JWT-based Authentication**

- Upon successful authentication via the **Client Operations** container, the user is issued a **JWT** signed with a secret key. This JWT is used by the client to access the enclave through REST APIs.
    - The enclave verifies the JWT using the same secret key to ensure that only authenticated users can access it.

### **6. Ingress for External Access**

- Both the Licensing Server (Client and Server Operations) and the enclave are accessible externally through **Kubernetes Ingress** resources.
    - Ingress allows external users to reach the **Client Operations** container for authentication and the **enclave pod** for secure interactions.

---

### **2.2 Security Considerations and Changes**

With this  architecture, several security enhancements and considerations are applied to ensure secure provisioning, communication, and management of keys and credentials.

### **Key Provisioning and Authentication:**

1. **Secure Key Generation**:
    - TLS certificates for both the **Licensing Server** (Client and Server Operations) and the **Enclave Pods** are generated and managed by **Cert-manager**.
    - Certificates are automatically renewed and securely mounted into the corresponding pods using **Kubernetes Secrets**.
2. **JWT Security**:
    - A **JWT** is issued after successful user authentication and is signed with a secure, secret key.
    - The enclave verifies this JWT using the same secret before granting access to the client, ensuring that only authenticated clients can communicate with the enclave.
    - This prevents unauthorized access to enclave resources and adds an additional layer of authentication beyond initial user login.
    - The JWT secret used for authentication should be kept secure to prevent unauthorized access. To achieve this, the YAML file for the JWT secret resource should be encrypted using **age** and **sops**. This process involves pushing only the encrypted file to version control, ensuring sensitive information remains protected. Developers who possess the decryption key can pull the encrypted file, decrypt it, and utilize the JWT secret in their applications.
    
    jwt-secret.yaml example :
    
    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
        name: jwt-secret
    type: opaque
    data:
        JWT_SECRET_KEY: base64 decoded value here
    
    ```
    
3. **TPM Quote Security**:
    - The **TPM** securely stores the hash of the enclave’s TLS certificate. When requested, the **Server Operations** container interacts with the TPM to generate a signed quote.
    - This quote is used by the client to verify the enclave’s identity, ensuring the integrity of the enclave and protecting against tampering.

### **Authentication and Communication Channels:**

1. **Client-Server Separation**:
    - By dividing the Licensing Server into two containers, security is improved by separating external communication (handled by **Client Operations**) from sensitive server-side operations (handled by **Server Operations**). This reduces the attack surface and isolates critical processes.
2. **gRPC for Internal Communication**:
    - **gRPC** is used for secure, efficient communication between the **Client Operations** and **Server Operations** containers. This ensures that sensitive operations like provisioning and TPM interactions are handled securely within the same pod.
3. **Secure RESTful APIs**:
    - **REST APIs** are exposed by the **Client Operations** container for user authentication and token management. Once a user is authenticated and has a valid **JWT**, they can use this token to interact with the enclave.
4. **Ingress Security**:
    - **Kubernetes Ingress** is configured to expose both the Licensing Server (Client and Server Operations) and the enclave securely to the external network.
    - The Ingress enforces HTTPS connections, ensuring that all client-server communication is encrypted.

### **Enclave Access Control:**

1. **Client Verification via JWT**:
    - Before granting access to the enclave, the **Enclave Pod** verifies the **JWT** presented by the client.
    - If the token is valid and unexpired, the client is granted access; otherwise, access is denied.
2. **End-to-End Encryption**:
    - All communication between the client and enclave, as well as between internal services, is encrypted using **TLS** certificates issued by Cert-manager.
    - Mutual TLS verification ensures that both the client and the enclave trust each other.

<aside>
💡

### Resources:

- Cert-manager Official Documentation: https://cert-manager.io/docs/
- Kubernetes Secrets: https://kubernetes.io/docs/concepts/configuration/secret/
- TPM Attestation: https://trustedcomputinggroup.org/developer/resources/
</aside>

# How to run the project

```yaml
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.crds.yaml
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl apply -f '.\Cert-Manager\manifests\'
```

```yaml
kubectl apply -f '.\Licensing Server\manifests\.'
```

![image.png](/Readme_imgs/image.png)

## Using postman

### Signup

![image.png](/Readme_imgs/image%201.png)

![image.png](/Readme_imgs/image%202.png)

### login

![image.png](/Readme_imgs/image%203.png)

![image.png](/Readme_imgs/076169b0-bfec-47aa-8f9b-bac7572f9f23.png)

### enclave

![image.png](/Readme_imgs/image%204.png)

![image.png](/Readme_imgs/image%205.png)

![image.png](/Readme_imgs/image%206.png)