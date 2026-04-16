import { FraudGraphEdge } from "../models/FraudGraphEdge.js";

function buildProjectedGraph(edges) {
  const edgeGroups = new Map();
  for (const edge of edges) {
    const valueKey = `${edge.edgeType}:${edge.value}`;
    if (!edgeGroups.has(valueKey)) edgeGroups.set(valueKey, []);
    edgeGroups.get(valueKey).push(edge);
  }

  const graph = new Map();

  const ensureNode = (nodeId) => {
    if (!graph.has(nodeId)) {
      graph.set(nodeId, new Map());
    }
  };

  for (const groupedEdges of edgeGroups.values()) {
    for (let index = 0; index < groupedEdges.length; index += 1) {
      const left = groupedEdges[index];
      const leftId = left.user.toString();
      ensureNode(leftId);

      for (let inner = index + 1; inner < groupedEdges.length; inner += 1) {
        const right = groupedEdges[inner];
        const rightId = right.user.toString();
        if (leftId === rightId) continue;
        ensureNode(rightId);

        const sharedWeight = Math.max(1, Number(left.weight || 1)) + Math.max(1, Number(right.weight || 1));
        graph.get(leftId).set(rightId, (graph.get(leftId).get(rightId) || 0) + sharedWeight);
        graph.get(rightId).set(leftId, (graph.get(rightId).get(leftId) || 0) + sharedWeight);
      }
    }
  }

  return graph;
}

function calculateDegrees(graph) {
  const degrees = new Map();
  let totalWeight = 0;

  for (const [node, neighbors] of graph.entries()) {
    let degree = 0;
    for (const weight of neighbors.values()) {
      degree += weight;
    }
    degrees.set(node, degree);
    totalWeight += degree;
  }

  return { degrees, totalWeight: totalWeight / 2 };
}

function modularityGain({ node, targetCommunity, assignments, graph, degrees, totalWeight }) {
  const neighbors = graph.get(node) || new Map();
  const nodeDegree = degrees.get(node) || 0;
  let edgesIntoCommunity = 0;
  let communityDegree = 0;

  for (const [neighbor, weight] of neighbors.entries()) {
    if (assignments.get(neighbor) === targetCommunity) {
      edgesIntoCommunity += weight;
    }
  }

  for (const [member, communityId] of assignments.entries()) {
    if (communityId === targetCommunity) {
      communityDegree += degrees.get(member) || 0;
    }
  }

  if (!totalWeight) return 0;
  return edgesIntoCommunity - (nodeDegree * communityDegree) / (2 * totalWeight);
}

export function runCommunityDetection(edges) {
  const graph = buildProjectedGraph(edges);
  const nodes = Array.from(graph.keys());
  if (!nodes.length) return [];

  const { degrees, totalWeight } = calculateDegrees(graph);
  const assignments = new Map(nodes.map((node) => [node, node]));

  for (let pass = 0; pass < 6; pass += 1) {
    let moved = false;

    for (const node of nodes) {
      const currentCommunity = assignments.get(node);
      const neighborCommunities = new Set([currentCommunity]);
      for (const neighbor of graph.get(node)?.keys() || []) {
        neighborCommunities.add(assignments.get(neighbor));
      }

      let bestCommunity = currentCommunity;
      let bestGain = modularityGain({
        node,
        targetCommunity: currentCommunity,
        assignments,
        graph,
        degrees,
        totalWeight
      });

      for (const community of neighborCommunities) {
        const gain = modularityGain({
          node,
          targetCommunity: community,
          assignments,
          graph,
          degrees,
          totalWeight
        });

        if (gain > bestGain + 0.01) {
          bestGain = gain;
          bestCommunity = community;
        }
      }

      if (bestCommunity !== currentCommunity) {
        assignments.set(node, bestCommunity);
        moved = true;
      }
    }

    if (!moved) break;
  }

  const grouped = new Map();
  for (const [node, communityId] of assignments.entries()) {
    if (!grouped.has(communityId)) grouped.set(communityId, []);
    grouped.get(communityId).push(node);
  }

  const communities = Array.from(grouped.values())
    .filter((members) => members.length)
    .map((members, index) => {
      const internalWeight = members.reduce((sum, member) => {
        const neighbors = graph.get(member) || new Map();
        let localWeight = 0;
        for (const [neighbor, weight] of neighbors.entries()) {
          if (members.includes(neighbor)) localWeight += weight;
        }
        return sum + localWeight;
      }, 0) / 2;

      const totalDegree = members.reduce((sum, member) => sum + (degrees.get(member) || 0), 0);
      return {
        id: `community-${index + 1}`,
        members,
        size: members.length,
        internalWeight,
        density: Number((internalWeight / Math.max(1, totalDegree)).toFixed(2))
      };
    })
    .sort((left, right) => right.size - left.size || right.internalWeight - left.internalWeight);

  return communities;
}

export async function getUserClusterInsights(userId) {
  const edges = await FraudGraphEdge.find({}).select("user edgeType value weight");
  const communities = runCommunityDetection(edges);
  const userCommunity = communities.find((community) => community.members.includes(userId.toString()));
  return {
    clusterId: userCommunity?.id || "community-isolated",
    clusterSize: userCommunity?.size || 1,
    clusterDensity: userCommunity?.density || 0,
    internalWeight: userCommunity?.internalWeight || 0,
    clusterRisk: userCommunity ? Math.min(100, Math.round(16 + userCommunity.size * 10 + (userCommunity.density || 0) * 25)) : 14
  };
}
