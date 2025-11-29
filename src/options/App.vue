<template>
  <vn-app v-if="dataLoaded">
    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_services') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_speechService')"
            :items="listItems.speechService"
            v-model="options.speechService"
            transition="scale-transition"
          >
          </vn-select>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'googleSpeechApi'"
        >
          <vn-text-field
            :label="getText('inputLabel_apiKey')"
            v-model.trim="options.googleSpeechApiKey"
          >
          </vn-text-field>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'googleSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/aprendeineamx-max/Buster-Captcha-Extension/wiki/Configuring-Google-Cloud-Speech-to-Text"
        >
          {{ getText('linkText_apiGuide') }}
        </a>

        <div
          class="option text-field"
          v-if="options.speechService === 'ibmSpeechApi'"
        >
          <vn-text-field
            v-model.trim="options.ibmSpeechApiUrl"
            :label="getText('inputLabel_apiUrl')"
          >
          </vn-text-field>
        </div>
        <div
          class="option text-field"
          v-if="options.speechService === 'ibmSpeechApi'"
        >
          <vn-text-field
            v-model.trim="options.ibmSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </vn-text-field>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'ibmSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/aprendeineamx-max/Buster-Captcha-Extension/wiki/Configuring-IBM-Watson-Speech-to-Text"
        >
          {{ getText('linkText_apiGuide') }}
        </a>

        <div
          class="option select"
          v-if="options.speechService === 'microsoftSpeechApi'"
        >
          <vn-select
            :label="getText('optionTitle_microsoftSpeechApiLoc')"
            :items="listItems.microsoftSpeechApiLoc"
            v-model="options.microsoftSpeechApiLoc"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div
          class="option text-field"
          v-if="options.speechService === 'microsoftSpeechApi'"
        >
          <vn-text-field
            v-model.trim="options.microsoftSpeechApiKey"
            :label="getText('inputLabel_apiKey')"
          >
          </vn-text-field>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'microsoftSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/aprendeineamx-max/Buster-Captcha-Extension/wiki/Configuring-Microsoft-Azure-Speech-to-Text"
        >
          {{ getText('linkText_apiGuide') }}
        </a>

        <vn-text-field
          class="text-field"
          v-if="options.speechService === 'witSpeechApi'"
          v-for="item in witSpeechApis"
          :key="item.id"
          :model-value="options.witSpeechApiKeys[item] || ''"
          :label="
            getText('inputLabel_apiKeyType', [
              getText(`optionValue_witSpeechApiLang_${item}`)
            ])
          "
          @update:modelValue="saveWitSpeechApiKey($event.trim(), item)"
        >
        </vn-text-field>
        <div
          class="wit-add-api"
          v-if="options.speechService === 'witSpeechApi'"
        >
          <vn-select
            :label="getText('optionTitle_witSpeechApiLang')"
            :items="listItems.witSpeechApiLang"
            v-model="witSpeechApiLang"
            transition="scale-transition"
          >
          </vn-select>

          <vn-button :disabled="!witSpeechApiLang" @click="addWitSpeechApi">
            {{ getText('buttonLabel_addApi') }}
          </vn-button>
        </div>

        <a
          class="service-guide"
          v-if="options.speechService === 'witSpeechApi'"
          target="_blank"
          rel="noreferrer"
          href="https://github.com/aprendeineamx-max/Buster-Captcha-Extension/wiki/Configuring-Wit.ai"
        >
          {{ getText('linkText_apiGuide') }}
        </a>
      </div>
    </div>

    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_sttAdvanced') }}
      </div>
      <div class="option-wrap">
        <div class="option text-field">
          <vn-text-field
            :label="getText('optionTitle_speechServiceOrder')"
            :hint="getText('optionDescription_speechServiceOrder')"
            persistent-hint
            v-model.trim="speechServiceOrderInput"
          >
          </vn-text-field>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'customHttp'"
        >
          <vn-text-field
            :label="getText('optionTitle_customSpeechApiUrl')"
            v-model.trim="options.customSpeechApiUrl"
          >
          </vn-text-field>
        </div>

        <div
          class="option select"
          v-if="options.speechService === 'customHttp'"
        >
          <vn-select
            :label="getText('optionTitle_customSpeechApiMethod')"
            :items="customHttpMethods"
            item-title="title"
            item-value="value"
            v-model="options.customSpeechApiMethod"
            transition="scale-transition"
          >
          </vn-select>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'customHttp'"
        >
          <vn-text-field
            :label="getText('optionTitle_customSpeechApiHeaders')"
            v-model.trim="options.customSpeechApiHeaders"
          >
          </vn-text-field>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'customHttp'"
        >
          <vn-text-field
            :label="getText('optionTitle_customSpeechApiBodyTemplate')"
            v-model.trim="options.customSpeechApiBodyTemplate"
          >
          </vn-text-field>
        </div>

        <div
          class="option text-field"
          v-if="options.speechService === 'customHttp'"
        >
          <vn-text-field
            :label="getText('optionTitle_customSpeechApiResponsePath')"
            v-model.trim="options.customSpeechApiResponsePath"
          >
          </vn-text-field>
        </div>
      </div>
    </div>

    <div class="section section-client">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_client') }}
      </div>
      <div class="section-desc" v-once>
        {{ getText('optionSectionDescription_client') }}
      </div>
      <div class="option-wrap">
        <div
          class="option"
          v-if="
            clientAppInstalled ||
            (clientAppVerified && options.simulateUserInput)
          "
        >
          <vn-switch
            :label="getText('optionTitle_simulateUserInput')"
            v-model="options.simulateUserInput"
          ></vn-switch>
        </div>

        <div
          class="option"
          v-if="clientAppVerified && options.simulateUserInput"
        >
          <vn-switch
            :label="getText('optionTitle_navigateWithKeyboard')"
            v-model="options.navigateWithKeyboard"
          ></vn-switch>
        </div>

        <div class="option" v-if="clientAppInstalled">
          <vn-switch
            :label="getText('optionTitle_autoUpdateClientApp')"
            v-model="options.autoUpdateClientApp"
          ></vn-switch>
        </div>

        <div
          class="client-download"
          v-if="clientAppVerified && !clientAppInstalled"
        >
          <div
            class="download-desc"
            v-html="
              getText('pageContent_optionClientAppDownloadDesc', [
                `<a target='_blank' rel='noreferrer' href='${installGuideUrl}'>${getText(
                  'linkText_installGuide'
                )}</a>`
              ])
            "
          ></div>
          <div class="download-error" v-if="!clientAppDownloadUrl">
            {{ getText('pageContent_optionClientAppOSError') }}
          </div>

          <vn-button
            class="download-button"
            :disabled="!clientAppDownloadUrl"
            @click="$refs.dlLink.click()"
            variant="elevated"
          >
            {{ getText('buttonLabel_downloadApp') }}
          </vn-button>
          <a
            ref="dlLink"
            class="download-link"
            target="_blank"
            rel="noreferrer"
            :href="clientAppDownloadUrl"
          ></a>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_logging') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_logLevel')"
            :items="listItems.logLevel"
            v-model="options.logLevel"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option text-field">
          <vn-text-field
            :label="getText('optionTitle_logSampleRate')"
            :hint="getText('optionDescription_logSampleRate')"
            persistent-hint
            v-model.number="options.logSampleRate"
          >
          </vn-text-field>
        </div>
        <div class="option text-field">
          <vn-text-field
            :label="getText('optionTitle_logSearch')"
            v-model.trim="logSearch"
          >
          </vn-text-field>
        </div>
        <div class="option text-field">
          <vn-text-field
            :label="getText('optionTitle_logHost')"
            v-model.trim="logHost"
          >
          </vn-text-field>
        </div>
        <div class="option text-field dates">
          <vn-text-field
            type="date"
            :label="getText('optionTitle_logDateFrom')"
            v-model="logDateFrom"
          ></vn-text-field>
          <vn-text-field
            type="date"
            :label="getText('optionTitle_logDateTo')"
            v-model="logDateTo"
          ></vn-text-field>
        </div>
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_logFilter')"
            :items="listItems.logLevelFilter"
            v-model="logLevelFilter"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_logScopeFilter')"
            :items="logScopeItems"
            v-model="logScopeFilter"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_logPageSize')"
            :items="logPageSizeItems"
            v-model="logPageSize"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option log-summary" v-if="filteredLogs.length">
          <div class="summary-item">
            <span>{{ getText('label_logsTotal') }}</span>
            <strong>{{ logSummary.total }}</strong>
          </div>
          <div class="summary-item">
            <span>info</span><strong>{{ logSummary.info || 0 }}</strong>
          </div>
          <div class="summary-item">
            <span>warn</span><strong>{{ logSummary.warn || 0 }}</strong>
          </div>
          <div class="summary-item">
            <span>error</span><strong>{{ logSummary.error || 0 }}</strong>
          </div>
        </div>
        <div class="option metrics">
          <div class="metrics-actions">
            <vn-button
              class="vn-icon--start"
              :loading="metricsLoading"
              @click="fetchMetrics"
              variant="tonal"
              size="small"
              ><vn-icon icon="refresh"></vn-icon>
              {{ getText('buttonLabel_refreshMetrics') }}</vn-button
            >
            <vn-button
              class="vn-icon--start"
              :loading="metricsLoading"
              @click="clearMetrics"
              variant="tonal"
              size="small"
              ><vn-icon icon="delete"></vn-icon>
              {{ getText('buttonLabel_clearMetrics') }}</vn-button
            >
            <vn-button
              class="vn-icon--start"
              :loading="metricsLoading"
              @click="downloadMetrics"
              variant="tonal"
              size="small"
              ><vn-icon icon="download"></vn-icon>
              {{ getText('buttonLabel_downloadMetrics') }}</vn-button
            >
            <vn-button
              class="vn-icon--start"
              :loading="metricsLoading"
              @click="downloadMetricsCsv"
              variant="tonal"
              size="small"
              ><vn-icon icon="download"></vn-icon>
              {{ getText('buttonLabel_downloadMetricsCsv') }}</vn-button
            >
          </div>
          <div class="metrics-table" v-if="metricsTable.length">
            <div class="metrics-row metrics-head">
              <span>Driver</span><span>OK</span><span>Fail</span
              ><span>Avg (ms)</span
              ><span>{{ getText('tableHeader_successRate') }}</span>
            </div>
            <div
              class="metrics-row"
              v-for="item in metricsTable"
              :key="item.driver"
            >
              <span>{{ item.driver }}</span>
              <span>{{ item.ok }}</span>
              <span>{{ item.fail }}</span>
              <span>{{ item.avgMs }}</span>
              <span class="metric-rate">
                <span class="rate-text">{{ item.successRate }}%</span>
                <span class="rate-bar">
                  <span
                    class="rate-fill"
                    :style="{width: `${Math.min(item.successRate, 100)}%`}"
                  ></span>
                </span>
              </span>
            </div>
          </div>
          <div class="logs-empty" v-else>
            {{ getText('label_noMetrics') }}
          </div>
        </div>
        <div class="option logs">
          <div class="logs-actions">
            <vn-button
              class="vn-icon--start"
              :loading="logsLoading"
              @click="fetchLogs"
              variant="tonal"
              size="small"
              ><vn-icon icon="refresh"></vn-icon>
              {{ getText('buttonLabel_refreshLogs') }}</vn-button
            >
            <vn-button
              class="vn-icon--start"
              :loading="logsLoading"
              @click="clearLogs"
              variant="tonal"
              size="small"
              ><vn-icon icon="delete"></vn-icon>
              {{ getText('buttonLabel_clearLogs') }}</vn-button
            >
            <vn-button
              class="vn-icon--start"
              :loading="logsLoading"
              @click="downloadLogs"
              variant="tonal"
              size="small"
              ><vn-icon icon="download"></vn-icon>
              {{ getText('buttonLabel_downloadLogs') }}</vn-button
            >
            <vn-button
              class="vn-icon--start"
              :loading="logsLoading"
              @click="downloadLogsCsv"
              variant="tonal"
              size="small"
              ><vn-icon icon="download"></vn-icon>
              {{ getText('buttonLabel_downloadLogsCsv') }}</vn-button
            >
          </div>
          <div class="logs-list" v-if="filteredLogs.length">
            <div class="log-row" v-for="(log, idx) in pagedLogs" :key="idx">
              <span class="log-ts" @click="setSort('ts')">{{ formatTs(log.ts) }}</span>
              <span class="log-level" @click="setSort('level')">{{ log.level }}</span>
              <span class="log-scope" @click="setSort('scope')">{{ log.scope }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div class="logs-pagination">
              <vn-button
                :disabled="logPage === 1"
                size="small"
                variant="tonal"
                @click="logPage = Math.max(1, logPage - 1)"
                >{{ getText('buttonLabel_prevPage') }}</vn-button
              >
              <span class="logs-page-label">
                {{ logPage }} / {{ logTotalPages }}
              </span>
              <vn-button
                :disabled="logPage === logTotalPages"
                size="small"
                variant="tonal"
                @click="logPage = Math.min(logTotalPages, logPage + 1)"
                >{{ getText('buttonLabel_nextPage') }}</vn-button
              >
            </div>
          </div>
          <div class="logs-empty" v-else>
            {{ getText('label_noLogs') }}
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_misc') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_appTheme')"
            :items="listItems.appTheme"
            v-model="options.appTheme"
            transition="scale-transition"
          >
          </vn-select>
        </div>
        <div class="option">
          <vn-switch
            :label="getText('optionTitle_loadEnglishChallenge')"
            v-model="options.loadEnglishChallenge"
          ></vn-switch>
        </div>
        <div class="option" v-if="!options.loadEnglishChallenge">
          <vn-switch
            :label="getText('optionTitle_tryEnglishSpeechModel')"
            v-model="options.tryEnglishSpeechModel"
          ></vn-switch>
        </div>
        <div class="option" v-if="enableContributions">
          <vn-switch
            :label="getText('optionTitle_showContribPage')"
            v-model="options.showContribPage"
          ></vn-switch>
        </div>
        <div class="option button" v-if="enableContributions">
          <vn-button
            class="contribute-button vn-icon--start"
            @click="showContribute"
            ><vn-icon
              src="/src/assets/icons/misc/favorite-filled.svg"
            ></vn-icon>
            {{ getText('buttonLabel_contribute') }}
          </vn-button>
        </div>
      </div>
    </div>
  </vn-app>
</template>

<script>
import {toRaw} from 'vue';
import {App, Button, Icon, Select, Switch, TextField} from 'vueton';

import storage from 'storage/storage';
import {getListItems, showContributePage, pingClientApp} from 'utils/app';
import {getText} from 'utils/common';
import {enableContributions, clientAppVersion} from 'utils/config';
import {
  optionKeys,
  clientAppPlatforms,
  captchaWitSpeechApiLangCodes,
  microsoftSpeechApiRegions
} from 'utils/data';

export default {
  components: {
    [App.name]: App,
    [Button.name]: Button,
    [Icon.name]: Icon,
    [Select.name]: Select,
    [Switch.name]: Switch,
    [TextField.name]: TextField
  },

  data: function () {
    return {
      dataLoaded: false,

      listItems: {
        ...getListItems(
          {
            speechService: [
              'witSpeechApiDemo',
              'googleSpeechApi',
              'witSpeechApi',
              'ibmSpeechApi',
              'microsoftSpeechApi',
              'customHttp'
            ]
          },
          {scope: 'optionValue_speechService'}
        ),
        ...getListItems(
          {microsoftSpeechApiLoc: microsoftSpeechApiRegions},
          {scope: 'optionValue_microsoftSpeechApiLoc'}
        ),
        ...getListItems(
          {
            witSpeechApiLang: [
              ...new Set(
                Object.values(captchaWitSpeechApiLangCodes).filter(Boolean)
              )
            ].sort()
          },
          {scope: 'optionValue_witSpeechApiLang'}
        ),
        ...getListItems(
          {appTheme: ['auto', 'light', 'dark', 'highContrast']},
          {scope: 'optionValue_appTheme'}
        ),
        logLevel: [
          {value: 'debug', title: 'debug'},
          {value: 'info', title: 'info'},
          {value: 'warn', title: 'warn'},
          {value: 'error', title: 'error'}
        ],
        logLevelFilter: [
          {value: 'all', title: 'all'},
          {value: 'debug', title: 'debug'},
          {value: 'info', title: 'info'},
          {value: 'warn', title: 'warn'},
          {value: 'error', title: 'error'}
        ]
      },

      enableContributions,

      witSpeechApiLang: null,
      witSpeechApis: [],
      customHttpMethods: [
        {value: 'POST', title: 'POST'},
        {value: 'PUT', title: 'PUT'},
        {value: 'PATCH', title: 'PATCH'},
        {value: 'GET', title: 'GET'}
      ],

      clientAppVerified: false,
      clientAppInstalled: false,
      clientAppDownloadUrl: '',
      installGuideUrl: '',
      logs: [],
      logsLoading: false,
      logLevelFilter: 'all',
      logSearch: '',
      logScopeFilter: 'all',
      logPage: 1,
      logPageSize: 25,
      logDateFrom: '',
      logDateTo: '',
      logHost: '',
      logSort: {column: 'ts', dir: 'desc'},
      sttMetrics: {},
      metricsLoading: false,

      options: {
        speechService: '',
        googleSpeechApiKey: '',
        ibmSpeechApiUrl: '',
        ibmSpeechApiKey: '',
        microsoftSpeechApiLoc: '',
        microsoftSpeechApiKey: '',
        speechServiceOrder: [],
        customSpeechApiUrl: '',
        customSpeechApiMethod: 'POST',
        customSpeechApiHeaders: '',
        customSpeechApiBodyTemplate: '',
        customSpeechApiResponsePath: '',
        logLevel: 'info',
        logSampleRate: 1,
        witSpeechApiKeys: {},
        loadEnglishChallenge: false,
        tryEnglishSpeechModel: false,
        simulateUserInput: false,
        autoUpdateClientApp: false,
        navigateWithKeyboard: false,
        appTheme: '',
        showContribPage: false
      }
    };
  },

  computed: {
    speechServiceOrderInput: {
      get() {
        return Array.isArray(this.options.speechServiceOrder)
          ? this.options.speechServiceOrder.join(',')
          : '';
      },
      set(value) {
        const next = value
          ? value.split(',').map(item => item.trim()).filter(Boolean)
          : [];
        this.options.speechServiceOrder = next;
      }
    },

    filteredLogs: function () {
      const from = this.logDateFrom ? new Date(this.logDateFrom).getTime() : null;
      const to = this.logDateTo ? new Date(this.logDateTo).getTime() : null;

      const filtered = (this.logs || [])
        .filter(log =>
          this.logLevelFilter === 'all' ? true : log.level === this.logLevelFilter
        )
        .filter(log =>
          this.logScopeFilter === 'all' ? true : log.scope === this.logScopeFilter
        )
        .filter(log => {
          if (from && log.ts && Number(log.ts) < from) return false;
          if (to && log.ts && Number(log.ts) > to) return false;
          return true;
        })
        .filter(log => {
          if (!this.logHost) return true;
          return (log.host || '').toLowerCase().includes(this.logHost.toLowerCase());
        })
        .filter(log => {
          if (!this.logSearch) return true;
          const q = this.logSearch.toLowerCase();
          return (
            (log.scope || '').toLowerCase().includes(q) ||
            (log.message || '').toLowerCase().includes(q)
          );
        });

      const {column, dir} = this.logSort;
      const sorted = filtered.slice().sort((a, b) => {
        const va = a[column] || '';
        const vb = b[column] || '';
        if (column === 'ts') {
          return (Number(vb) || 0) - (Number(va) || 0);
        }
        return va.localeCompare(vb);
      });

      if (dir === 'asc') {
        sorted.reverse();
      }

      return sorted;
    },

      logScopeItems: function () {
        const scopes = Array.from(
          new Set((this.logs || []).map(log => log.scope).filter(Boolean))
        ).sort();
        return [{value: 'all', title: 'all'}].concat(
          scopes.map(s => ({value: s, title: s}))
        );
    },

    logPageSizeItems: function () {
      return [10, 25, 50, 100].map(v => ({value: v, title: v.toString()}));
    },

    pagedLogs: function () {
      const start = (this.logPage - 1) * this.logPageSize;
      return this.filteredLogs.slice(start, start + this.logPageSize);
    },

    logTotalPages: function () {
      return Math.max(1, Math.ceil(this.filteredLogs.length / this.logPageSize));
    },

    logSummary: function () {
      const counts = {debug: 0, info: 0, warn: 0, error: 0, total: 0};
      for (const log of this.filteredLogs) {
        counts[log.level] = (counts[log.level] || 0) + 1;
        counts.total += 1;
      }
      return counts;
    },

    metricsTable: function () {
      const rows = Object.entries(this.sttMetrics || {}).map(
        ([driver, stats]) => ({
          driver,
          ok: stats.ok || 0,
          fail: stats.fail || 0,
          avgMs: stats.avgMs || 0,
          total: (stats.ok || 0) + (stats.fail || 0)
        })
      );

      return rows
        .map(row => ({
          ...row,
          successRate: row.total ? Math.round((row.ok / row.total) * 100) : 0
        }))
        .sort((a, b) => b.total - a.total);
    }
  },

  methods: {
    getText,

    setup: async function () {
      browser.runtime.onMessage.addListener(this.onMessage);

      const options = await storage.get(optionKeys);

      for (const option of Object.keys(this.options)) {
        const defaultValue = this.options[option];
        const storedValue =
          options[option] === undefined ? defaultValue : options[option];
        this.options[option] = storedValue;

        this.$watch(
          `options.${option}`,
          async function (value) {
            await storage.set({[option]: toRaw(value)});
            await browser.runtime.sendMessage({id: 'optionChange'});
          },
          {deep: true}
        );
      }

      this.witSpeechApis = Object.keys(options.witSpeechApiKeys);
      this.setWitSpeechApiLangOptions();

      document.title = getText('pageTitle', [
        getText('pageTitle_options'),
        getText('extensionName')
      ]);

      this.verifyClientApp();

      this.dataLoaded = true;
    },

    onMessage: function (request, sender) {
      if (request.id === 'reloadOptionsPage') {
        self.location.reload();
      }
    },

    verifyClientApp: async function () {
      try {
        await pingClientApp();
        this.clientAppInstalled = true;
      } catch (err) {
        if (!this.installGuideUrl) {
          this.installGuideUrl =
            'https://github.com/aprendeineamx-max/Buster-Captcha-Extension/wiki/Installing-the-client-app';
          const {os, arch} = this.$env;
          if (clientAppPlatforms.includes(`${os}/${arch}`)) {
            this.installGuideUrl += `#${os}`;
            this.clientAppDownloadUrl = `https://github.com/aprendeineamx-max/buster-client/releases/download/v${clientAppVersion}/buster-client-setup-v${clientAppVersion}-${os}-${arch}`;
            if (os === 'windows') {
              this.clientAppDownloadUrl += '.exe';
            }
          }
        }

        this.clientAppInstalled = false;
      }

      this.clientAppVerified = true;
    },

    setWitSpeechApiLangOptions: function () {
      this.listItems.witSpeechApiLang = this.listItems.witSpeechApiLang.filter(
        item => !this.witSpeechApis.includes(item.value)
      );
    },

    addWitSpeechApi: function () {
      this.witSpeechApis.push(this.witSpeechApiLang);
      this.witSpeechApiLang = null;
      this.setWitSpeechApiLangOptions();
    },

    saveWitSpeechApiKey: function (value, lang) {
      const apiKeys = this.options.witSpeechApiKeys;
      if (value) {
        this.options.witSpeechApiKeys = Object.assign({}, apiKeys, {
          [lang]: value
        });
      } else if (apiKeys[lang]) {
        delete apiKeys[lang];
        this.options.witSpeechApiKeys = Object.assign({}, apiKeys);
      }
    },

    showContribute: async function () {
      await showContributePage();
    },

    fetchLogs: async function () {
      this.logsLoading = true;
      try {
        const logs = await browser.runtime.sendMessage({id: 'getLogs'});
        this.logs = Array.isArray(logs) ? logs.slice().reverse() : [];
      } catch (err) {
        this.logs = [];
      } finally {
        this.logsLoading = false;
      }
    },

    clearLogs: async function () {
      this.logsLoading = true;
      try {
        await browser.runtime.sendMessage({id: 'clearLogs'});
        this.logs = [];
      } catch (err) {
      } finally {
        this.logsLoading = false;
      }
    },

    fetchMetrics: async function () {
      this.metricsLoading = true;
      try {
        const metrics = await browser.runtime.sendMessage({id: 'getSttMetrics'});
        this.sttMetrics = metrics || {};
      } catch (err) {
        this.sttMetrics = {};
      } finally {
        this.metricsLoading = false;
      }
    },

    clearMetrics: async function () {
      this.metricsLoading = true;
      try {
        await browser.runtime.sendMessage({id: 'clearSttMetrics'});
        this.sttMetrics = {};
      } catch (err) {
      } finally {
        this.metricsLoading = false;
      }
    },

    downloadMetrics: function () {
      const rows = this.metricsTable;
      const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buster-metrics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    downloadMetricsCsv: function () {
      const rows = this.metricsTable;
      const header = ['driver', 'ok', 'fail', 'avgMs', 'successRate'];
      const lines = [header.join(',')].concat(
        rows.map(
          r =>
            `${r.driver},${r.ok},${r.fail},${r.avgMs},${r.successRate}`
        )
      );
      const blob = new Blob([lines.join('\n')], {
        type: 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buster-metrics-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },

    downloadLogs: function () {
      const blob = new Blob([JSON.stringify(this.logs, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buster-logs-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    downloadLogsCsv: function () {
      const rows = this.filteredLogs;
      const header = ['ts', 'level', 'scope', 'host', 'message'];
      const lines = [header.join(',')].concat(
        rows.map(r => {
          const msg = (r.message || '').replace(/"/g, '""');
          const scope = (r.scope || '').replace(/"/g, '""');
          const host = (r.host || '').replace(/"/g, '""');
          return `${r.ts || ''},${r.level || ''},"${scope}","${host}","${msg}"`;
        })
      );
      const blob = new Blob([lines.join('\n')], {
        type: 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buster-logs-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },

    formatTs: function (ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return d.toLocaleString();
    }
  },

  created: function () {
    document.title = getText('pageTitle', [
      getText('pageTitle_options'),
      getText('extensionName')
    ]);

    this.setup();
    this.fetchLogs();
    this.fetchMetrics();
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;
@include vueton.transitions;

.v-application__wrap {
  display: grid;
  grid-row-gap: 32px;
  grid-column-gap: 48px;
  padding: 24px;
  grid-auto-rows: min-content;
  grid-auto-columns: min-content;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 32px;
}

.logs {
  width: 100%;
}

.metrics {
  width: 100%;
}

.metrics-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.metrics-table {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #1118270d;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
}

.metrics-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px 100px;
  gap: 8px;
  font-size: 13px;
  align-items: center;
}

.metrics-head {
  font-weight: 600;
  text-transform: uppercase;
}

.metric-rate {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-text {
  width: 48px;
}

.rate-bar {
  position: relative;
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.rate-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

[data-theme='highContrast'] .rate-bar {
  background: #1f2937;
}

[data-theme='highContrast'] .rate-fill {
  background: linear-gradient(90deg, #34d399, #22c55e);
}

.logs-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: #1118270d;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
}

.log-row {
  display: grid;
  grid-template-columns: 180px 70px 120px 1fr;
  gap: 8px;
  font-size: 13px;
  align-items: center;
}

.log-level {
  text-transform: uppercase;
  font-weight: 600;
}

.log-level.debug {
  color: #2563eb;
}
.log-level.info {
  color: #16a34a;
}
.log-level.warn {
  color: #ca8a04;
}
.log-level.error {
  color: #dc2626;
}

.log-message {
  overflow: hidden;
  text-overflow: ellipsis;
}

.logs-empty {
  color: #6b7280;
  font-size: 13px;
}

[data-theme='highContrast'] .logs-list,
[data-theme='highContrast'] .metrics-table {
  background: #111827;
  border-color: #f5f5f5;
  color: #f5f5f5;
}

[data-theme='highContrast'] .log-level.debug {
  color: #60a5fa;
}
[data-theme='highContrast'] .log-level.info {
  color: #34d399;
}
[data-theme='highContrast'] .log-level.warn {
  color: #fcd34d;
}
[data-theme='highContrast'] .log-level.error {
  color: #f87171;
}

.section-desc {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;

  padding-top: 8px;
  max-width: 380px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 24px;
  padding-top: 24px;
}

.option {
  display: flex;
  align-items: center;
  height: 20px;

  &.button {
    height: 40px;
  }

  &.select,
  &.text-field {
    height: 56px;
  }

  & .contribute-button {
    @include vueton.theme-prop(color, primary);

    & .vn-icon {
      @include vueton.theme-prop(background-color, cta);
    }
  }
}

.text-field .v-input__control {
  width: 326px;
}

.section-client .section-desc {
  width: 272px;
}

.wit-add-api {
  display: flex;
  align-items: center;

  & .vn-select {
    & .v-input__control,
    & .v-input__details {
      max-width: calc(100vw - 48px - 124px) !important;
    }
  }

  & .vn-button {
    margin-left: 24px;
    @include vueton.theme-prop(color, primary);
  }
}

.service-guide {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.5px;
  line-height: 24px;
}

.client-download {
  width: 272px;
}

.download-desc,
.download-error {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;
}

.download-desc a {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;
}

.download-desc {
  max-width: 240px;
}

.download-error {
  margin-top: 12px;
  @include vueton.theme-prop(color, error);
}

.download-link {
  visibility: hidden;
}

.download-button {
  margin-top: 24px;
  @include vueton.theme-prop(background-color, primary);

  & .v-btn__content {
    @include vueton.theme-prop(color, on-primary);
  }
}
</style>
