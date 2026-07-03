# System Architecture

1.  **Overall Architecture:**
    *   Layered architecture following Clean Architecture principles.
    *   Domain layer as the core, surrounded by application services, adapters, and presentation layer.
    *   Event-driven communication via Kafka for asynchronous operations.

2.  **Service Boundaries:**
    *   **Auth Service:** User management, authentication, RBAC.
    *   **Policy Service:** Policy definition, versioning, validation.
    *   **Risk Service:** Risk assessment, scoring, monitoring.
    *   **Approval Service:** Approval workflows, notifications.
    *   **Execution Service:** Command execution, state management.
    *   **Audit Service:** Immutable logging, compliance reporting.

3.  **Clean Architecture & DDD:**
    *   **Entities:** `Policy`, `ExecutionRequest`, `Approval`, `RiskProfile`.
    *   **Use Cases:** `CreatePolicyUseCase`, `ExecuteCommandUseCase`, `ApproveRequestUseCase`.
    *   **Adapters:** Kafka producers/consumers, REST APIs, database repositories.

4.  **Event-Driven Communication:**
    *   **Event Schema:** Standardized event structure with `eventId`, `eventType`, `timestamp`, `aggregateId`, `payload`, `metadata`.
    *   **Event Topics:** `policy.created`, `execution.requested`, `approval.required`, `execution.completed`, `execution.failed`, `risk.detected`.

5.  **Deployment Topology:**
    ```
    User/Client → Load Balancer → API Gateway → Auth Service
                              ↓
                    ┌─────────────────────────────────────┐
                    │          KAFKA CLUSTER              │
                    │                                     │
                    │  policy.created ────> Policy Service │
                    │  execution.requested --> Execution Svc │
                    │  approval.required --> Approval Svc   │
                    │  risk.detected -----> Risk Service   │
                    └─────────────────────────────────────┘
    ```

6.  **Request Lifecycle:**
    ```mermaid
    sequenceDiagram
        participant Client
        participant API
        participant ExecutionSvc
        participant Kafka
        participant ApprovalSvc
        participant RiskSvc
        participant AuditSvc

        Client->>API: POST /execute
        API->>ExecutionSvc: createExecution(request)
        ExecutionSvc->>Kafka: publish execution.requested
        Kafka-->>ExecutionSvc: ack
        ExecutionSvc->>AuditSvc: record(REQUESTED)
        ExecutionSvc-->>API: executionId
        API-->>Client: 202 Accepted

        Note over Kafka, ApprovalSvc: async processing
        Kafka->>ApprovalSvc: execution.requested
        ApprovalSvc->>RiskSvc: assessRisk(request)
        RiskSvc-->>ApprovalSvc: riskScore
        ApprovalSvc->>ApprovalSvc: determineApprovalLevel(riskScore)
        ApprovalSvc->>Kafka: publish approval.required
        Kafka-->>ApprovalSvc: ack

        Note over ApprovalSvc, ExecutionSvc: human interaction
        ApprovalSvc->>ExecutionSvc: approve(requestId, approver)
        ExecutionSvc->>AuditSvc: record(APPROVED)
        ExecutionSvc->>Kafka: publish execution.approved
        Kafka-->>ExecutionSvc: ack

        Note over Kafka, ExecutionSvc: autonomous execution
        Kafka->>ExecutionSvc: execution.approved
        ExecutionSvc->>ExecutionSvc: executeCommand()
        ExecutionSvc->>AuditSvc: record(EXECUTED)
        ExecutionSvc->>Kafka: publish execution.completed
        Kafka-->>ExecutionSvc: ack
        ExecutionSvc-->>API: ExecutionResult
        API-->>Client: 200 OK
    ```
