import dns from "node:dns";

export function configureDnsFromEnvironment() {
  const configuredServers = process.env.DNS_SERVERS;
  if (configuredServers === undefined) return;

  const servers = configuredServers.split(",").map((server) => server.trim()).filter(Boolean);
  if (servers.length === 0) {
    throw new Error("DNS_SERVERS is set but contains no DNS server addresses.");
  }

  dns.setServers(servers);
  dns.setDefaultResultOrder("ipv4first");
}
