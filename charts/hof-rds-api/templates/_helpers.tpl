{{- define "hof-rds-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hof-rds-api.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "hof-rds-api.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hof-rds-api.labels" -}}
helm.sh/chart: {{ include "hof-rds-api.chart" . }}
app.kubernetes.io/name: {{ include "hof-rds-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "hof-rds-api.selectorLabels" -}}
{{- if .Values.selectorLabels }}
{{- toYaml .Values.selectorLabels -}}
{{- else }}
app.kubernetes.io/name: {{ include "hof-rds-api.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- end -}}

{{- define "hof-rds-api.serviceName" -}}
{{- if .Values.service.name -}}
{{- .Values.service.name -}}
{{- else -}}
{{- include "hof-rds-api.fullname" . -}}
{{- end -}}
{{- end -}}

{{- define "hof-rds-api.configMapName" -}}
{{- if .Values.configMap.name -}}
{{- .Values.configMap.name -}}
{{- else -}}
{{- include "hof-rds-api.fullname" . -}}
{{- end -}}
{{- end -}}

{{- define "hof-rds-api.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "hof-rds-api.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "hof-rds-api.runtimeSecretName" -}}
{{- $externalSecretTarget := .Values.externalSecret.target | default dict -}}
{{- $externalSecretTargetName := $externalSecretTarget.name | default "" -}}
{{- if .Values.secrets.name -}}
{{- .Values.secrets.name -}}
{{- else if $externalSecretTargetName -}}
{{- $externalSecretTargetName -}}
{{- else -}}
{{- include "hof-rds-api.fullname" . -}}
{{- end -}}
{{- end -}}

