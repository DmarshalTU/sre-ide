#!/bin/bash

# KAgent Setup Script
# This script sets up KAgent with required components
# 
# IMPORTANT: Replace the placeholder API key with your actual Anthropic API key
# Get your API key from: https://console.anthropic.com/

echo "🚀 Setting up KAgent..."

# Install KAgent CRDs
helm upgrade --install kmcp-crds oci://ghcr.io/kagent-dev/kmcp/helm/kmcp-crds --namespace kagent --create-namespace
helm upgrade --install kagent-crds oci://ghcr.io/kagent-dev/kagent/helm/kagent-crds  --namespace kagent

# Install KAgent with Anthropic provider
# Replace YOUR_ANTHROPIC_API_KEY with your actual API key
helm upgrade --install kagent oci://ghcr.io/kagent-dev/kagent/helm/kagent --namespace kagent \
                                    --set providers.default=anthropic \
                                    --set providers.anthropic.apiKey=YOUR_ANTHROPIC_API_KEY \
                                    --set querydoc.enabled=false

# Install Victoria Metrics for observability
helm upgrade --install vls oci://ghcr.io/victoriametrics/helm-charts/victoria-logs-single  -n vmks --create-namespace
helm upgrade --install victoria-metrics oci://ghcr.io/victoriametrics/helm-charts/victoria-metrics-cluster -n vmks

echo "✅ KAgent setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Replace YOUR_ANTHROPIC_API_KEY with your actual API key"
echo "2. Configure your KAgent instance"
echo "3. Start using SRE IDE to connect to KAgent"