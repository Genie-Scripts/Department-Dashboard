
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

    const resizePlots = (container) => {
        if (window.Plotly && container) {
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
                setTimeout(() => resizePlots(dynamicContent), 100);
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

    // --- 初期表示とリサイズ処理 ---
    // 確実な初期描画のため、短い遅延後にリサイズを実行
    setTimeout(() => {
        resizePlots(dynamicContent);
    }, 200);

    // ウィンドウリサイズ時の再描画（debounce処理）
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
             resizePlots(document.getElementById('dynamic-content'));
        }, 250);
    });
});
