import fs from "node:fs";
import path from "node:path";

const inputPath = "C:/Users/HARIS ALI/Downloads/cookup (1).json";
const outputPath = path.resolve("workflows/cookup-http-webhooks.json");

const workflow = JSON.parse(fs.readFileSync(inputPath, "utf8"));
workflow.name = "cookup - HTTP webhooks";
workflow.active = false;

const nodeByName = new Map(workflow.nodes.map((node) => [node.name, node]));

function mustNode(name) {
  const node = nodeByName.get(name);
  if (!node) {
    throw new Error(`Missing node: ${name}`);
  }
  return node;
}

function addNode(node) {
  workflow.nodes.push(node);
  nodeByName.set(node.name, node);
}

function connect(from, to) {
  workflow.connections[from] = {
    main: [
      [
        {
          node: to,
          type: "main",
          index: 0
        }
      ]
    ]
  };
}

function disconnect(from) {
  workflow.connections[from] = { main: [[]] };
}

function makeWebhook({ id, name, method, path: webhookPath, position }) {
  return {
    parameters: {
      httpMethod: method,
      path: webhookPath,
      responseMode: "responseNode",
      options: {}
    },
    id,
    name,
    type: "n8n-nodes-base.webhook",
    typeVersion: 2.1,
    position,
    webhookId: id
  };
}

function makeRespond({ id, name, responseBody, position }) {
  return {
    parameters: {
      respondWith: "json",
      responseBody,
      options: {}
    },
    id,
    name,
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1.4,
    position
  };
}

function makeCode({ id, name, jsCode, position }) {
  return {
    parameters: { jsCode },
    id,
    name,
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position
  };
}

const originalOrderForm = mustNode("Customer Order Form");
originalOrderForm.name = "Customer Order Webhook";
originalOrderForm.type = "n8n-nodes-base.webhook";
originalOrderForm.typeVersion = 2.1;
originalOrderForm.parameters = {
  httpMethod: "POST",
  path: "cookup/order",
  responseMode: "responseNode",
  options: {}
};

nodeByName.delete("Customer Order Form");
nodeByName.set("Customer Order Webhook", originalOrderForm);

addNode(
  makeCode({
    id: "0a63ef48-0574-46bf-b6ec-8f4d8f671901",
    name: "Customer Order Form",
    position: [-448, -24],
    jsCode: `const body = $input.item.json.body ?? $input.item.json;
return [{
  customer_name: body.customer_name,
  customer_phone: body.customer_phone,
  customer_email: body.customer_email ?? "",
  message: body.message,
  delivery_address: body.delivery_address
}];`
  })
);

mustNode("Insert/Update Customer").position = [-224, -24];
mustNode("Generate Order ID").position = [0, -24];
mustNode("Insert Meal Request").position = [224, -24];

delete workflow.connections["Customer Order Form"];
connect("Customer Order Webhook", "Customer Order Form");
connect("Customer Order Form", "Insert/Update Customer");

const orderResponse = mustNode("Show Order Confirmation");
orderResponse.type = "n8n-nodes-base.respondToWebhook";
orderResponse.typeVersion = 1.4;
orderResponse.parameters = {
  respondWith: "json",
  responseBody: `={{
{
  ok: true,
  status: "proposal_created",
  order_id: $("Generate Order ID").item.json.order_id,
  proposal_id: $("Insert Meal Proposal").item.json.id,
  proposal_summary: JSON.parse($("Create Meal Proposal").item.json.output).proposal_summary,
  delivery_time: JSON.parse($("Create Meal Proposal").item.json.output).delivery_time,
  chef_name: JSON.parse($("Create Meal Proposal").item.json.output).chef
}
}}`,
  options: {}
};

const finalResponse = mustNode("Send Final Confirmation");
finalResponse.type = "n8n-nodes-base.respondToWebhook";
finalResponse.typeVersion = 1.4;
finalResponse.parameters = {
  respondWith: "json",
  responseBody: `={{
{
  ok: true,
  status: "confirmed",
  order_id: $("Generate Order Number").item.json.order_id,
  proposal_id: $("Fetch Order Context").item.json.id,
  proposal_summary: $("Fetch Order Context").item.json.proposal_summary,
  delivery_time: $("Fetch Order Context").item.json.delivery_time
}
}}`,
  options: {}
};

const cancelResponse = mustNode("Send Cancellation Response");
cancelResponse.type = "n8n-nodes-base.respondToWebhook";
cancelResponse.typeVersion = 1.4;
cancelResponse.parameters = {
  respondWith: "json",
  responseBody: `={{
{
  ok: true,
  status: "cancelled",
  proposal_id: $("Show Customer Confirmation Form").item.json.proposal_id
}
}}`,
  options: {}
};

const decisionWebhook = mustNode("Show Customer Confirmation Form");
decisionWebhook.name = "Customer Decision Webhook";
decisionWebhook.type = "n8n-nodes-base.webhook";
decisionWebhook.typeVersion = 2.1;
decisionWebhook.position = [1504, 220];
decisionWebhook.parameters = {
  httpMethod: "POST",
  path: "cookup/decision",
  responseMode: "responseNode",
  options: {}
};
nodeByName.delete("Show Customer Confirmation Form");
nodeByName.set("Customer Decision Webhook", decisionWebhook);

addNode(
  makeCode({
    id: "c9127316-f8da-442b-b815-54cd34754173",
    name: "Show Customer Confirmation Form",
    position: [1728, 220],
    jsCode: `const body = $input.item.json.body ?? $input.item.json;
const decision = String(body.decision ?? body["Do you want to confirm this order?"] ?? "").toUpperCase();
return [{
  proposal_id: body.proposal_id,
  decision,
  "Do you want to confirm this order?": decision
}];`
  })
);

connect("Customer Decision Webhook", "Show Customer Confirmation Form");
connect("Show Customer Confirmation Form", "Check Customer Confirmation");
disconnect("Fetch Customer for Notification");

mustNode("Check Customer Confirmation").parameters.conditions.conditions[0].leftValue = "={{ $json.decision }}";
mustNode("Check Customer Confirmation").parameters.conditions.conditions[0].rightValue = "CONFIRM";

mustNode("Fetch Order Context").parameters.filters.conditions[0].keyValue =
  '={{ $("Show Customer Confirmation Form").item.json.proposal_id }}';

const proposalCredentials = structuredClone(mustNode("Insert Meal Proposal").credentials);

addNode(
  makeWebhook({
    id: "b18e6238-c7b3-4975-83a4-9d77df0c2ef1",
    name: "Proposal Status Webhook",
    method: "GET",
    path: "cookup/status",
    position: [-672, 620]
  })
);

addNode(
  makeCode({
    id: "222fe67d-d03d-4d7d-8324-15ac26e93c7b",
    name: "Normalize Status Request",
    position: [-448, 620],
    jsCode: `const json = $input.item.json;
return [{
  proposal_id: json.query?.proposal_id ?? json.body?.proposal_id ?? json.proposal_id
}];`
  })
);

addNode({
  parameters: {
    operation: "get",
    tableId: "meal_proposals",
    filters: {
      conditions: [
        {
          keyName: "id",
          keyValue: '={{ $("Normalize Status Request").item.json.proposal_id }}'
        }
      ]
    }
  },
  id: "0b277b6a-8055-4a3a-8202-7e93ee46f37f",
  name: "Fetch Proposal Status",
  type: "n8n-nodes-base.supabase",
  typeVersion: 1,
  position: [-224, 620],
  alwaysOutputData: true,
  credentials: proposalCredentials
});

addNode(
  makeRespond({
    id: "5fd74670-a10b-4c30-a56c-f48c5270ff0d",
    name: "Respond Proposal Status",
    position: [0, 620],
    responseBody: `={{
{
  ok: !!$("Fetch Proposal Status").item.json.id,
  proposal_id: $("Fetch Proposal Status").item.json.id,
  status: $("Fetch Proposal Status").item.json.status,
  proposal_summary: $("Fetch Proposal Status").item.json.proposal_summary,
  delivery_time: $("Fetch Proposal Status").item.json.delivery_time,
  chef_name: $("Fetch Proposal Status").item.json.chef_name,
  error: $("Fetch Proposal Status").item.json.id ? undefined : "Proposal not found"
}
}}`
  })
);

connect("Proposal Status Webhook", "Normalize Status Request");
connect("Normalize Status Request", "Fetch Proposal Status");
connect("Fetch Proposal Status", "Respond Proposal Status");

addNode({
  parameters: {
    operation: "update",
    tableId: "meal_proposals",
    filters: {
      conditions: [
        {
          keyName: "id",
          condition: "eq",
          keyValue: '={{ $("Show Customer Confirmation Form").item.json.proposal_id }}'
        }
      ]
    },
    fieldsUi: {
      fieldValues: [
        {
          fieldId: "status",
          fieldValue: "cancelled"
        }
      ]
    }
  },
  id: "ded60888-ed26-4794-bbf9-0d59ac0c136e",
  name: "Mark Proposal Cancelled",
  type: "n8n-nodes-base.supabase",
  typeVersion: 1,
  position: [2400, 316],
  credentials: proposalCredentials
});

workflow.connections["Check Customer Confirmation"].main[1][0].node = "Mark Proposal Cancelled";
connect("Mark Proposal Cancelled", "Send Cancellation Response");
cancelResponse.position = [2624, 316];

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2));
console.log(`Generated ${outputPath}`);
