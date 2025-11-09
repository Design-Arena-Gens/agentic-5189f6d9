"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  Activity,
  AlertTriangle,
  Box,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Layers3,
  ListTree,
  Loader2,
  Network,
  PlusCircle,
  RefreshCcw,
  ServerCog,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { ActionRequest, Cluster, Deployment, Namespace, PlatformState } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ModalState =
  | { type: "createCluster" }
  | { type: "createNamespace"; clusterId: string }
  | { type: "createDeployment"; clusterId: string; namespaceId: string }
  | {
      type: "scaleDeployment";
      clusterId: string;
      namespaceId: string;
      deploymentId: string;
      replicas: number;
    };

export function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<PlatformState>("/api/state", fetcher, {
    refreshInterval: 5000,
  });

  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverVariant, setServerVariant] = useState<"success" | "error" | null>(null);

  const clusters = useMemo(() => data?.clusters ?? [], [data]);
  const selectedCluster = useMemo(() => {
    if (!clusters.length) return undefined;
    return clusters.find((cluster) => cluster.id === selectedClusterId) ?? clusters[0];
  }, [clusters, selectedClusterId]);

  const uptime = selectedCluster
    ? formatDistanceToNow(new Date(selectedCluster.createdAt), { addSuffix: false })
    : "-";

  const aggregated = useMemo(() => {
    if (!selectedCluster) {
      return {
        cpuUsage: 0,
        cpuCapacity: 0,
        memoryUsage: 0,
        memoryCapacity: 0,
        podCount: 0,
        podCapacity: 0,
        storageUsage: 0,
        storageCapacity: 0,
      };
    }
    const { metrics } = selectedCluster;
    return {
      cpuUsage: metrics.workloadsCpuUsage,
      cpuCapacity: metrics.workloadsCpuCapacity,
      memoryUsage: metrics.workloadsMemoryUsage,
      memoryCapacity: metrics.workloadsMemoryCapacity,
      podCount: metrics.podCount,
      podCapacity: metrics.podCapacity,
      storageUsage: metrics.storageUsage,
      storageCapacity: metrics.storageCapacity,
    };
  }, [selectedCluster]);

  useEffect(() => {
    if (!serverMessage) return;
    const timeout = window.setTimeout(() => {
      setServerMessage(null);
      setServerVariant(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [serverMessage]);

  const handleAction = async (request: ActionRequest) => {
    setIsSubmitting(true);
    setServerMessage(null);
    setServerVariant(null);
    try {
      const response = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const payload = await response.json();
      if (!response.ok) {
        setServerMessage(payload.message ?? "Operation failed");
        setServerVariant("error");
        return;
      }
      mutate(payload.state, false);
      setModalState(null);
      setServerMessage(payload.message ?? "Action processed");
      setServerVariant("success");
    } catch (err) {
      setServerMessage(err instanceof Error ? err.message : "Unexpected error");
      setServerVariant("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-8 py-6 shadow-xl">
          <Loader2 className="size-6 animate-spin" />
          <span>Bootstrapping control plane…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-6 py-5 text-red-200">
          Failed to load platform state. Please refresh.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
              <ServerCog className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">On-Prem Control Fabric</p>
              <h1 className="text-xl font-semibold text-white">Atlas Kubernetes Platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>RBAC enforced</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-3 py-2">
              <Activity className="size-4 text-sky-400" />
              <span>Streaming telemetry live</span>
            </div>
          </div>
        </div>
      </header>

      {serverMessage && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div
            className={clsx(
              "rounded-xl border px-4 py-3 text-sm",
              serverVariant === "error"
                ? "border-red-500/50 bg-red-500/10 text-red-200"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
            )}
          >
            {serverMessage}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10">
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/5 bg-slate-950/70 shadow-lg shadow-slate-950/40">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Clusters</p>
                  <h2 className="text-base font-semibold text-white">Fleet inventory</h2>
                </div>
                <button
                  onClick={() => setModalState({ type: "createCluster" })}
                  className="flex items-center gap-1 rounded-lg border border-sky-500/60 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition-colors hover:bg-sky-500/20"
                >
                  <PlusCircle className="size-4" />
                  New cluster
                </button>
              </div>
              <ul className="divide-y divide-white/5">
                {clusters.map((cluster) => (
                  <li key={cluster.id}>
                    <button
                      onClick={() => setSelectedClusterId(cluster.id)}
                      className={clsx(
                        "flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition-colors",
                        selectedCluster?.id === cluster.id
                          ? "bg-sky-500/10 text-white"
                          : "hover:bg-white/5",
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{cluster.name}</span>
                          <span
                            className={clsx(
                              "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                              statusBadge(cluster.status),
                            )}
                          >
                            {cluster.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {cluster.nodes.length} nodes • {cluster.namespaces.length} namespaces • v{cluster.version}
                        </p>
                        <p className="text-[0.6rem] uppercase tracking-widest text-slate-500">
                          {cluster.labels.join(" • ")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end text-xs text-slate-400">
                        <span>{cluster.distribution.toUpperCase()}</span>
                        <span>{formatDistanceToNow(new Date(cluster.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-white/5 bg-slate-950/70 shadow-lg shadow-slate-950/40">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Audit trail</p>
                  <h2 className="text-base font-semibold text-white">Recent activity</h2>
                </div>
              </div>
              <ul className="divide-y divide-white/5">
                {data.events.map((event) => (
                  <li key={event.id} className="px-5 py-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={clsx(
                          "mt-1 flex h-7 w-7 items-center justify-center rounded-full border",
                          event.level === "error"
                            ? "border-red-500/40 bg-red-500/10 text-red-200"
                            : event.level === "warning"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
                        )}
                      >
                        {event.level === "error" ? (
                          <AlertTriangle className="size-4" />
                        ) : event.level === "warning" ? (
                          <AlertTriangle className="size-4" />
                        ) : (
                          <CheckCircle2 className="size-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>{formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}</span>
                          <span className="uppercase tracking-widest">{event.source}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-200">{event.message}</p>
                        <p className="mt-1 text-[0.6rem] uppercase tracking-widest text-slate-500">
                          {event.clusterId && `Cluster • ${event.clusterId}`} {event.namespaceId && `• Namespace • ${event.namespaceId}`}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </aside>

          <section className="space-y-6">
            {selectedCluster ? (
              <div className="space-y-6">
                <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Cluster overview</p>
                      <h2 className="text-xl font-semibold text-white">{selectedCluster.name}</h2>
                      <p className="mt-2 max-w-2xl text-sm text-slate-400">{selectedCluster.description}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                        Version <span className="ml-1 font-medium text-slate-200">{selectedCluster.version}</span>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                        Uptime <span className="ml-1 font-medium text-slate-200">{uptime}</span>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="CPU usage"
                      icon={Cpu}
                      value={`${aggregated.cpuUsage.toFixed(1)} / ${aggregated.cpuCapacity} cores`}
                      percent={percent(aggregated.cpuUsage, aggregated.cpuCapacity)}
                    />
                    <MetricCard
                      label="Memory usage"
                      icon={Database}
                      value={`${aggregated.memoryUsage.toFixed(0)} / ${aggregated.memoryCapacity} GiB`}
                      percent={percent(aggregated.memoryUsage, aggregated.memoryCapacity)}
                    />
                    <MetricCard
                      label="Pods scheduled"
                      icon={Layers3}
                      value={`${aggregated.podCount} / ${aggregated.podCapacity}`}
                      percent={percent(aggregated.podCount, aggregated.podCapacity)}
                    />
                    <MetricCard
                      label="Storage"
                      icon={Box}
                      value={`${aggregated.storageUsage.toFixed(0)} / ${aggregated.storageCapacity} TiB`}
                      percent={percent(aggregated.storageUsage, aggregated.storageCapacity)}
                    />
                  </dl>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <NodeInventory cluster={selectedCluster} onCordon={(nodeId) => handleAction({ action: "cordonNode", payload: { clusterId: selectedCluster.id, nodeId } })} onUncordon={(nodeId) => handleAction({ action: "uncordonNode", payload: { clusterId: selectedCluster.id, nodeId } })} />
                  <NetworkingCard cluster={selectedCluster} />
                </section>

                <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Namespaces</p>
                      <h3 className="text-lg font-semibold text-white">Workload tenants</h3>
                    </div>
                    <button
                      onClick={() => setModalState({ type: "createNamespace", clusterId: selectedCluster.id })}
                      className="flex items-center gap-1 rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20"
                    >
                      <PlusCircle className="size-4" />
                      New namespace
                    </button>
                  </div>

                  <div className="mt-6 space-y-6">
                    {selectedCluster.namespaces.map((namespace) => (
                      <NamespacePanel
                        key={namespace.id}
                        namespace={namespace}
                        onCreateDeployment={() =>
                          setModalState({
                            type: "createDeployment",
                            clusterId: selectedCluster.id,
                            namespaceId: namespace.id,
                          })
                        }
                        onScaleDeployment={(deployment) =>
                          setModalState({
                            type: "scaleDeployment",
                            clusterId: selectedCluster.id,
                            namespaceId: namespace.id,
                            deploymentId: deployment.id,
                            replicas: deployment.replicas,
                          })
                        }
                        onDeleteDeployment={(deployment) =>
                          handleAction({
                            action: "deleteDeployment",
                            payload: {
                              clusterId: selectedCluster.id,
                              namespaceId: namespace.id,
                              deploymentId: deployment.id,
                            },
                          })
                        }
                        onRestartDeployment={(deployment) =>
                          handleAction({
                            action: "restartDeployment",
                            payload: {
                              clusterId: selectedCluster.id,
                              namespaceId: namespace.id,
                              deploymentId: deployment.id,
                            },
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40">
                <p className="text-sm text-slate-400">
                  No clusters registered yet. Deploy your first cluster to begin managing workloads.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {modalState && (
        <ActionModal
          key={modalState.type}
          state={modalState}
          cluster={
            modalState.type === "createCluster"
              ? null
              : selectedCluster ?? clusters.find((cluster) => cluster.id === modalState.clusterId) ?? null
          }
          isSubmitting={isSubmitting}
          message={serverMessage}
          close={() => setModalState(null)}
          submit={(request) => handleAction(request)}
        />
      )}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  percent: number;
};

function MetricCard({ label, icon: Icon, value, percent }: MetricCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">{label}</p>
          <p className="mt-2 text-lg font-semibold text-white">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 text-sky-300">
          <Icon className="size-5" />
        </div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/5">
        <div
          className={clsx("h-2 rounded-full", percent > 80 ? "bg-amber-400" : "bg-sky-400")}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
    </div>
  );
}

type NodeInventoryProps = {
  cluster: Cluster;
  onCordon: (nodeId: string) => void;
  onUncordon: (nodeId: string) => void;
};

function NodeInventory({ cluster, onCordon, onUncordon }: NodeInventoryProps) {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Nodes</p>
          <h3 className="text-lg font-semibold text-white">Control plane & workers</h3>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {cluster.nodes.length} total
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {cluster.nodes.map((node) => (
          <div
            key={node.id}
            className="rounded-xl border border-white/5 bg-white/5 px-4 py-4 text-sm text-slate-200 shadow-inner shadow-black/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{node.name}</span>
                  <span className="text-[0.65rem] uppercase tracking-widest text-slate-400">{node.role}</span>
                  <span className={clsx("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", statusBadge(node.status))}>
                    {node.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{node.internalIp} • {node.operatingSystem}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>CPU {node.metrics.cpuUsage} / {node.metrics.cpuCapacity}</span>
                <span>Memory {node.metrics.memoryUsage} / {node.metrics.memoryCapacity} GiB</span>
                <span>Pods {node.metrics.podCount}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {node.taints.includes("node.kubernetes.io/unschedulable") ? (
                  <button
                    onClick={() => onUncordon(node.id)}
                    className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Uncordon
                  </button>
                ) : (
                  <button
                    onClick={() => onCordon(node.id)}
                    className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-amber-200 hover:bg-amber-500/20"
                  >
                    Cordon
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type NetworkingCardProps = {
  cluster: Cluster;
};

function NetworkingCard({ cluster }: NetworkingCardProps) {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Networking</p>
          <h3 className="text-lg font-semibold text-white">Connectivity surface</h3>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {cluster.CNIProvider}
        </div>
      </div>
      <dl className="mt-5 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <Network className="size-4 text-sky-300" /> Control plane API
          </dt>
          <dd className="mt-2 text-slate-100">{cluster.controlPlaneEndpoint}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <Globe className="size-4 text-sky-300" /> Pod network CIDR
          </dt>
          <dd className="mt-2 text-slate-100">{cluster.networkingCidr}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <ListTree className="size-4 text-sky-300" /> Namespaces
          </dt>
          <dd className="mt-2 text-slate-100">{cluster.namespaces.map((ns) => ns.name).join(", ")}</dd>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 p-4">
          <dt className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-400">
            <RefreshCcw className="size-4 text-sky-300" /> Addons
          </dt>
          <dd className="mt-2 text-slate-100">{cluster.addons.join(", ")}</dd>
        </div>
      </dl>
    </section>
  );
}

type NamespacePanelProps = {
  namespace: Namespace;
  onCreateDeployment: () => void;
  onScaleDeployment: (deployment: Deployment) => void;
  onDeleteDeployment: (deployment: Deployment) => void;
  onRestartDeployment: (deployment: Deployment) => void;
};

function NamespacePanel({
  namespace,
  onCreateDeployment,
  onScaleDeployment,
  onDeleteDeployment,
  onRestartDeployment,
}: NamespacePanelProps) {
  const quota = namespace.resourceQuota;
  const coverage = percent(namespace.deployments.length, quota.pods);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-5 text-sm text-slate-200 shadow-inner shadow-black/10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-semibold text-white">{namespace.name}</h4>
            <span className={clsx("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", statusBadge(namespace.status))}>
              {namespace.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Quota {quota.cpu} CPU • {quota.memory} Memory • {quota.storage} Storage</p>
        </div>
        <button
          onClick={onCreateDeployment}
          className="flex items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/20"
        >
          <PlusCircle className="size-4" />
          New workload
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {namespace.deployments.map((deployment) => (
          <div key={deployment.id} className="flex h-full flex-col rounded-xl border border-white/5 bg-slate-950/60 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{deployment.name}</span>
                  <span className={clsx("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", statusBadge(deployment.status))}>
                    {deployment.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Image {deployment.containers[0]?.image}</p>
                <p className="text-[0.65rem] uppercase tracking-widest text-slate-500">Version {deployment.version}</p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>{deployment.availableReplicas}/{deployment.replicas} ready</div>
                <div>{formatDistanceToNow(new Date(deployment.updatedAt), { addSuffix: true })}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-[0.65rem] uppercase tracking-widest text-slate-400">
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                Ports: {deployment.containers[0]?.ports.join(", ") || "-"}
              </div>
              <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
                Strategy: {deployment.strategy.type}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => onScaleDeployment(deployment)}
                className="rounded-md border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-sky-200 hover:bg-sky-500/20"
              >
                Scale
              </button>
              <button
                onClick={() => onRestartDeployment(deployment)}
                className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-200 hover:bg-emerald-500/20"
              >
                Restart
              </button>
              <button
                onClick={() => onDeleteDeployment(deployment)}
                className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-red-200 hover:bg-red-500/20"
              >
                <div className="flex items-center gap-1">
                  <Trash2 className="size-3.5" />
                  Remove
                </div>
              </button>
            </div>
          </div>
        ))}
        {!namespace.deployments.length && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400 lg:col-span-2">
            <Layers3 className="size-6 text-slate-600" />
            <p className="mt-2">No workloads deployed yet.</p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-white/5 bg-slate-950/60 p-4 text-xs text-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[0.65rem] uppercase tracking-widest">Services</span>
            <span>{namespace.services.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[0.65rem] uppercase tracking-widest">ConfigMaps</span>
            <span>{namespace.configMaps.length}</span>
          </div>
          <div className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[0.65rem] uppercase tracking-widest">
            Utilisation {coverage}%
          </div>
        </div>
      </div>
    </div>
  );
}

type ActionModalProps = {
  state: ModalState;
  cluster: Cluster | null;
  isSubmitting: boolean;
  message: string | null;
  close: () => void;
  submit: (request: ActionRequest) => void;
};

type ModalFormValues = {
  name?: string;
  distribution?: Cluster["distribution"];
  version?: string;
  description?: string;
  endpoint?: string;
  cidr?: string;
  cni?: string;
  addons?: string;
  labels?: string;
  image?: string;
  replicas?: number;
  ports?: string;
};

function ActionModal({ state, cluster, isSubmitting, message, close, submit }: ActionModalProps) {
  const { register, handleSubmit, reset } = useForm<ModalFormValues>({
    defaultValues:
      state.type === "scaleDeployment"
        ? { replicas: state.replicas }
        : state.type === "createDeployment"
        ? { replicas: 2, ports: "80" }
        : {},
  });

  const onSubmit = handleSubmit((values) => {
    const toList = (input: unknown) =>
      String(input ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    const toPorts = (input: unknown) =>
      String(input ?? "")
        .split(",")
        .map((port) => Number(port.trim()))
        .filter((port) => !Number.isNaN(port) && port > 0);

    switch (state.type) {
      case "createCluster":
        submit({
          action: "createCluster",
          payload: {
            name: values.name!,
            distribution: values.distribution ?? "k8s",
            version: values.version!,
            description: values.description!,
            controlPlaneEndpoint: values.endpoint!,
            networkingCidr: values.cidr!,
            CNIProvider: values.cni!,
            addons: toList(values.addons),
            labels: toList(values.labels),
          },
        });
        break;
      case "createNamespace":
        submit({
          action: "createNamespace",
          payload: {
            clusterId: state.clusterId,
            name: values.name!,
            labels: toList(values.labels),
          },
        });
        break;
      case "createDeployment":
        submit({
          action: "createDeployment",
          payload: {
            clusterId: state.clusterId,
            namespaceId: state.namespaceId,
            name: values.name!,
            image: values.image!,
            replicas: Number(values.replicas ?? 0),
            ports: toPorts(values.ports),
          },
        });
        break;
      case "scaleDeployment":
        submit({
          action: "scaleDeployment",
          payload: {
            clusterId: state.clusterId,
            namespaceId: state.namespaceId,
            deploymentId: state.deploymentId,
            replicas: Number(values.replicas ?? state.replicas),
          },
        });
        break;
      default:
        break;
    }
    reset();
  });

  const deployment =
    state.type === "scaleDeployment"
      ? cluster
          ?.namespaces.find((ns) => ns.id === state.namespaceId)
          ?.deployments.find((dep) => dep.id === state.deploymentId)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur">
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-xl space-y-5 rounded-2xl border border-white/10 bg-slate-950/90 p-8 text-sm text-slate-200 shadow-2xl shadow-black/40"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{modalTitle(state, cluster, deployment ?? undefined)}</h2>
            <button type="button" onClick={close} className="text-xs text-slate-500 hover:text-slate-300">
              Close
            </button>
          </div>

          {state.type === "createCluster" && (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Name
                <input
                  {...register("name", { required: true })}
                  placeholder="Edge Fabric"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Distribution
                <select
                  {...register("distribution", { required: true })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="k8s">Vanilla Kubernetes</option>
                  <option value="k3s">K3s</option>
                  <option value="k0s">k0s</option>
                  <option value="openshift">OpenShift</option>
                  <option value="aks">AKS hybrid</option>
                  <option value="eks">EKS anywhere</option>
                  <option value="gke">GKE on-prem</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Version
                <input
                  {...register("version", { required: true })}
                  placeholder="1.30.5"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Control plane endpoint
                <input
                  {...register("endpoint", { required: true })}
                  placeholder="https://10.110.0.10:6443"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="md:col-span-2 flex flex-col gap-1 text-xs uppercase tracking-widest">
                Description
                <textarea
                  {...register("description", { required: true })}
                  placeholder="High availability cluster for edge workloads"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  rows={3}
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Pod network CIDR
                <input
                  {...register("cidr", { required: true })}
                  placeholder="10.244.0.0/16"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                CNI
                <input
                  {...register("cni", { required: true })}
                  placeholder="Cilium"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest md:col-span-2">
                Addons (comma separated)
                <input
                  {...register("addons")}
                  placeholder="kyverno, datadog, flux"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest md:col-span-2">
                Labels (key=value, comma separated)
                <input
                  {...register("labels")}
                  placeholder="environment=production, region=emea"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          {state.type === "createNamespace" && (
            <div className="space-y-4">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Name
                <input
                  {...register("name", { required: true })}
                  placeholder="supply-chain"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Labels
                <input
                  {...register("labels")}
                  placeholder="team=ops, tier=core"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          {state.type === "createDeployment" && (
            <div className="grid gap-4">
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Name
                <input
                  {...register("name", { required: true })}
                  placeholder="telemetry-gateway"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Container image
                <input
                  {...register("image", { required: true })}
                  placeholder="registry.local/telemetry/gateway:1.2.3"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Replicas
                <input
                  type="number"
                  min={0}
                  {...register("replicas", { required: true, valueAsNumber: true })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Ports (comma separated)
                <input
                  {...register("ports")}
                  placeholder="80, 443"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          {state.type === "scaleDeployment" && deployment && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Scaling <span className="font-semibold text-slate-200">{deployment.name}</span> in namespace {deployment.namespaceId}
              </p>
              <label className="flex flex-col gap-1 text-xs uppercase tracking-widest">
                Desired replicas
                <input
                  type="number"
                  min={0}
                  defaultValue={state.replicas}
                  {...register("replicas", { required: true, valueAsNumber: true })}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">{message}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  close();
                  setTimeout(() => reset(), 150);
                }}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs uppercase tracking-widest text-slate-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg border border-sky-500/60 bg-sky-500/20 px-4 py-2 text-xs uppercase tracking-widest text-sky-200 transition-colors hover:bg-sky-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                <span>{state.type === "scaleDeployment" ? "Apply" : "Submit"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function modalTitle(state: ModalState, cluster: Cluster | null, deployment?: Deployment) {
  switch (state.type) {
    case "createCluster":
      return "Register new on-prem cluster";
    case "createNamespace":
      return `Create namespace in ${cluster?.name ?? state.clusterId}`;
    case "createDeployment":
      const targetNamespace = cluster?.namespaces.find((ns) => ns.id === state.namespaceId);
      return `Deploy workload to ${targetNamespace?.name ?? state.namespaceId}`;
    case "scaleDeployment":
      return `Scale ${deployment?.name ?? "workload"}`;
    default:
      return "Action";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "Healthy":
      return "bg-emerald-500/10 text-emerald-200 border border-emerald-400/40";
    case "Warning":
      return "bg-amber-500/10 text-amber-200 border border-amber-400/40";
    case "Degraded":
      return "bg-red-500/10 text-red-200 border border-red-400/40";
    case "Critical":
      return "bg-red-500/20 text-red-100 border border-red-400/60";
    default:
      return "bg-slate-500/10 text-slate-200 border border-slate-400/40";
  }
}

function percent(value: number, total: number) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}
