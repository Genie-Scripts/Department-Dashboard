
// main.js (年度比較・病院全体対応版)
document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamic-content');
    const deptSelector = document.getElementById('dept-selector');
    const wardSelector = document.getElementById('ward-selector');
    const quickButtons = document.querySelectorAll('.quick-button');
    const loader = document.getElementById('loader');
    const initialContentHTML = dynamicContent.innerHTML;

    const getBasePath = () => {
        const path = window.location.pathname;
        const repoName = path.split('/')[1] || '';
        return window.location.hostname.includes('github.io') ? `/${repoName}` : '';
    };
    const basePath = getBasePath();

    const executeScriptsInContainer = (container) => {
        const scripts = container.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            newScript.innerHTML = oldScript.innerHTML;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    };

    const resizePlots = (container) => {
        if (window.Plotly) {
            const plots = container.querySelectorAll('.plotly-graph-div');
            plots.forEach(plot => {
                try {
                    Plotly.Plots.resize(plot);
                } catch (e) {
                    console.warn('Plotly resize error:', e);
                }
            });
        }
    };

    const loadContent = (fragmentPath) => {
        if (!fragmentPath) return;
        
        console.log('Loading fragment:', fragmentPath);
        loader.style.display = 'flex';
        const fullPath = `${basePath}/${fragmentPath}`;

        fetch(fullPath)
            .then(response => {
                if (!response.ok) throw new Error(`ファイルが見つかりません: ${fragmentPath}`);
                return response.text();
            })
            .then(html => {
                console.log('Fragment loaded successfully, length:', html.length);
                dynamicContent.innerHTML = html;
                executeScriptsInContainer(dynamicContent);
                // 年度比較チャートのリサイズ
                setTimeout(() => {
                    resizePlots(dynamicContent);
                }, 300);
            })
            .catch(error => {
                console.error('Fragment load error:', error);
                dynamicContent.innerHTML = `
                    <div class="error">
                        <h3>❌ コンテンツの読み込みに失敗しました</h3>
                        <p>ファイル: ${fragmentPath}</p>
                        <p>エラー: ${error.message}</p>
                    </div>`;
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
            
            console.log('Quick button clicked:', { fragment, selectorId });
            
            // セレクターの表示・非表示
            if (deptSelector) deptSelector.style.display = selectorId === 'dept-selector' ? 'flex' : 'none';
            if (wardSelector) wardSelector.style.display = selectorId === 'ward-selector' ? 'flex' : 'none';
            
            if(selectorId) {
                // セレクターをリセット
                if (selectorId === 'dept-selector' && deptSelector) {
                    deptSelector.value = "";
                    dynamicContent.innerHTML = `
                        <div class="placeholder-content">
                            <h2>🩺 診療科別年度比較</h2>
                            <p>上記のプルダウンから診療科を選択してください。</p>
                            <div class="placeholder-icon">📊</div>
                        </div>`;
                } else if (selectorId === 'ward-selector' && wardSelector) {
                    wardSelector.value = "";
                    dynamicContent.innerHTML = `
                        <div class="placeholder-content">
                            <h2>🏨 病棟別年度比較</h2>
                            <p>上記のプルダウンから病棟を選択してください。</p>
                            <div class="placeholder-icon">🏥</div>
                        </div>`;
                }
            }
            
            if (fragment) {
                if (fragment.includes('view-all')) {
                    // ⭐️ 修正: 病院全体ボタンが押された時もfragmentを読み込む
                    console.log('Loading hospital overall data from fragment');
                    loadContent(fragment);
                } else {
                    loadContent(fragment);
                }
            }
        });
    });
    
    const handleSelectChange = (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const fragment = selectedOption.dataset.fragment;
        console.log('Selector changed:', { fragment, value: event.target.value });
        
        if (fragment) {
            loadContent(fragment);
        } else {
            // プルダウンで「項目を選択」に戻された場合、プレースホルダーを再表示
            if(event.target.id === 'dept-selector') {
                dynamicContent.innerHTML = `
                    <div class="placeholder-content">
                        <h2>🩺 診療科別年度比較</h2>
                        <p>上記のプルダウンから診療科を選択してください。</p>
                        <div class="placeholder-icon">📊</div>
                    </div>`;
            } else if (event.target.id === 'ward-selector') {
                dynamicContent.innerHTML = `
                    <div class="placeholder-content">
                        <h2>🏨 病棟別年度比較</h2>
                        <p>上記のプルダウンから病棟を選択してください。</p>
                        <div class="placeholder-icon">🏥</div>
                    </div>`;
            }
        }
    };
    
    if (deptSelector) deptSelector.addEventListener('change', handleSelectChange);
    if (wardSelector) wardSelector.addEventListener('change', handleSelectChange);

    // 初期表示時のチャートリサイズ
    window.addEventListener('load', () => {
        setTimeout(() => {
            resizePlots(dynamicContent);
        }, 500);
    });
    
    // リサイズ時のチャート調整
    window.addEventListener('resize', () => {
        if (window.Plotly) {
            const plots = document.querySelectorAll('.plotly-graph-div');
            plots.forEach(plot => {
                try {
                    Plotly.Plots.resize(plot);
                } catch (e) {
                    console.warn('Plotly resize error:', e);
                }
            });
        }
    });
    
    // ⭐️ 追加: 初期表示時のデバッグ情報
    console.log('Year-over-year dashboard initialized');
    console.log('Initial content length:', initialContentHTML.length);
    console.log('Available selectors:', {
        dept: !!deptSelector,
        ward: !!wardSelector
    });
});
