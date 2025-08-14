
// main.js (初期表示強化・リサイズ安定化版)
document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamic-content');
    const deptSelector = document.getElementById('dept-selector');
    const wardSelector = document.getElementById('ward-selector');
    const quickButtons = document.querySelectorAll('.quick-button');
    const loader = document.getElementById('loader');

    const executeScriptsInContainer = (container) => {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.innerHTML = oldScript.innerHTML;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    };

    // ★★★ 強化されたチャートリサイズ処理 ★★★
    const resizePlots = (container) => {
        if (window.Plotly && container) {
            const plots = container.querySelectorAll('.plotly-graph-div');
            console.log(`📊 Found ${plots.length} Plotly charts to resize`);
            plots.forEach((plot, index) => {
                try {
                    // チャートが実際に存在し、表示されているかチェック
                    const rect = plot.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        console.log(`✅ Resizing chart ${index + 1}/${plots.length}`);
                        Plotly.Plots.resize(plot);
                    } else {
                        console.warn(`⚠️ Chart ${index + 1} is not visible (${rect.width}x${rect.height})`);
                        // 見えないチャートでも強制的にリサイズを試行
                        setTimeout(() => {
                            try {
                                Plotly.Plots.resize(plot);
                            } catch (e) {
                                console.warn(`Failed delayed resize for chart ${index + 1}:`, e);
                            }
                        }, 500);
                    }
                } catch (e) {
                    console.warn(`❌ Plotly resize error for chart ${index + 1}:`, e);
                }
            });
        }
    };

    // ★★★ 包括的な初期チャート表示処理 ★★★
    const initializeChartsComprehensively = () => {
        console.log('🚀 包括的チャート初期化開始...');
        
        // 1. 全体的なリサイズイベントを発火
        window.dispatchEvent(new Event('resize'));
        
        // 2. 複数のセレクタでチャートを検索してリサイズ
        const chartSelectors = [
            '.plotly-graph-div',
            '#dynamic-content .plotly-graph-div',
            '.chart-container .plotly-graph-div',
            '.view-content .plotly-graph-div',
            '.view-content.active .plotly-graph-div'
        ];
        
        chartSelectors.forEach(selector => {
            const charts = document.querySelectorAll(selector);
            if (charts.length > 0) {
                console.log(`📈 Selector "${selector}": ${charts.length} charts found`);
                charts.forEach((chart, index) => {
                    try {
                        if (window.Plotly) {
                            Plotly.Plots.resize(chart);
                        }
                    } catch (e) {
                        console.warn(`Chart resize failed (${selector}[${index}]):`, e);
                    }
                });
            }
        });
        
        // 3. 特定コンテナ内のチャートも処理
        if (dynamicContent) {
            resizePlots(dynamicContent);
        }
    };

    const loadContent = (fragmentPath) => {
        if (!fragmentPath) return;
        
        loader.style.display = 'flex';
        const basePath = window.location.hostname.includes('github.io') ? (window.location.pathname.split('/')[1] ? `/${window.location.pathname.split('/')[1]}` : '') : '';
        const fullPath = `${basePath}/${fragmentPath}`;

        fetch(fullPath)
            .then(response => {
                if (!response.ok) throw new Error(`ファイルが見つかりません: ${fragmentPath}`);
                return response.text();
            })
            .then(html => {
                dynamicContent.innerHTML = html;
                executeScriptsInContainer(dynamicContent);
                
                // 新規コンテンツ読み込み後のチャート初期化
                setTimeout(() => resizePlots(dynamicContent), 100);
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    resizePlots(dynamicContent);
                }, 500);
            })
            .catch(error => {
                console.error('Fragment load error:', error);
                dynamicContent.innerHTML = `<div class="error"><h3>コンテンツの読み込みに失敗</h3><p>${error.message}</p></div>`;
            })
            .finally(() => {
                loader.style.display = 'none';
            });
    };

    quickButtons.forEach(button => {
        button.addEventListener('click', () => {
            quickButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const fragment = button.dataset.fragment;
            const selectorId = button.dataset.selector;
            
            if (deptSelector) deptSelector.style.display = selectorId === 'dept-selector' ? 'flex' : 'none';
            if (wardSelector) wardSelector.style.display = selectorId === 'ward-selector' ? 'flex' : 'none';
            
            if (selectorId) {
                const placeholder = (type) => `<div class="placeholder-content"><h2>${type}別年度比較</h2><p>上のプルダウンから選択してください。</p><div class="placeholder-icon">📊</div></div>`;
                if (selectorId === 'dept-selector' && deptSelector) {
                    deptSelector.value = "";
                    dynamicContent.innerHTML = placeholder('診療科');
                } else if (selectorId === 'ward-selector' && wardSelector) {
                    wardSelector.value = "";
                    dynamicContent.innerHTML = placeholder('病棟');
                }
            }
            
            if (fragment) {
                loadContent(fragment);
            }
        });
    });
    
    const handleSelectChange = (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const fragment = selectedOption.dataset.fragment;
        if (fragment) {
            loadContent(fragment);
        }
    };
    
    if (deptSelector) deptSelector.addEventListener('change', handleSelectChange);
    if (wardSelector) wardSelector.addEventListener('change', handleSelectChange);

    // ★★★ 初期表示と定期的なチャートリサイズ処理 ★★★
    console.log('📊 DOM loaded - チャート初期化スケジュール開始');
    
    // Plotlyの読み込み待機
    const waitForPlotly = () => {
        if (typeof window.Plotly !== 'undefined') {
            console.log('✅ Plotly ready - starting chart initialization');
            
            // 複数のタイミングでチャート初期化を実行
            const initTimings = [200, 500, 1000, 2000, 3000];
            initTimings.forEach((delay, index) => {
                setTimeout(() => {
                    console.log(`🔄 Chart init attempt ${index + 1}/${initTimings.length} (${delay}ms)`);
                    initializeChartsComprehensively();
                }, delay);
            });
            
        } else {
            console.log('⏳ Waiting for Plotly...');
            setTimeout(waitForPlotly, 100);
        }
    };
    
    waitForPlotly();

    // ★★★ ウィンドウリサイズ時の処理（debounce付き） ★★★
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            console.log('📐 Window resized - refreshing charts');
            initializeChartsComprehensively();
        }, 250);
    });
    
    // ★★★ タブ/ウィンドウの可視状態変更時の処理 ★★★
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ Page became visible - refreshing charts');
            setTimeout(() => {
                initializeChartsComprehensively();
            }, 300);
        }
    });
    
    // ★★★ 追加: オリエンテーション変更時の処理（モバイル対応） ★★★
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            console.log('📱 Orientation changed - refreshing charts');
            initializeChartsComprehensively();
        }, 500);
    });
});
