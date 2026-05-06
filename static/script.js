document.addEventListener('DOMContentLoaded', () => {
    const addProcessButton = document.querySelector('.add-process-btn');
    const popup = document.getElementById('process-popup');
    const cancelButton = document.getElementById('cancel-process');
    const submitButton = document.getElementById('submit-process');
    const nameInput = document.getElementById('process-name');
    const burstInput = document.getElementById('process-burst');
    const memoryInput = document.getElementById('process-memory');
    const tableData = document.querySelector('.table-data');
    const startSimulationButton = document.getElementById('start-simulation');
    const resetProcessesButton = document.getElementById('reset-processes');
    const algorithmSpans = document.querySelectorAll('.algorithm span');
    const timeQuantumInput = document.querySelector('.time-quantum-input');

    //File System Part
    const addBtn = document.getElementById("add-file");
    const removeBtn = document.getElementById("remove-file");
    const printBtn = document.getElementById("print-file");
    const fileRowsContainer = document.querySelector(".file-rows");
    const filePopup = document.getElementById("file-popup");
    const filePopupTitle = document.getElementById("file-popup-title");
    const fileNameInput = document.getElementById("file-name");
    const fileContentInput = document.getElementById("file-content");
    const cancelFileBtn = document.getElementById("cancel-file");
    const submitFileBtn = document.getElementById("submit-file");
    const fileDeleteConfirmation = document.getElementById('file-delete-confirmation');
    const cancelDeleteFileBtn = document.getElementById('cancel-delete-file');
    const confirmDeleteFileBtn = document.getElementById('confirm-delete-file');
    const deleteConfirmMessage = document.querySelector('.confirm-message');

    //IO Simulation Part
    // === I/O Simulation Part ===
    const playBtn = document.querySelector('.io-controls .io-ctrl-button:nth-child(2)'); // Play
    const pauseBtn = document.querySelector('.io-controls .io-ctrl-button:nth-child(1)'); // Pause
    const resetBtn = document.querySelector('.io-controls .io-ctrl-button:nth-child(3)'); // Reset

    const printerStatusEl = document.querySelector('.io-item:nth-child(1) h2');
    const successfulPrintsEl = document.querySelector('.io-item:nth-child(2) h2');
    const failedPrintsEl = document.querySelector('.io-item:nth-child(3) h2');

    const navLinks = document.querySelectorAll('.navigation a');
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').slice(1);
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Part parin ng file system to 
    // Add File
    addBtn.addEventListener("click", () => {
        editingRow = null;
        filePopupTitle.textContent = "Add File";
        fileNameInput.value = "";
        fileContentInput.value = "";
        filePopup.classList.remove("hidden");
        });

        // Cancel
        cancelFileBtn.addEventListener("click", () => {
        filePopup.classList.add("hidden");
        });

        // Save
        submitFileBtn.addEventListener("click", () => {
        const name = fileNameInput.value.trim();
        const content = fileContentInput.value.trim();
        const type = 'DOCX';

        if (name && content) {
            const date = new Date().toLocaleString();
            const size = `${Math.max(1, Math.ceil(content.length / 80))} KB`;

            if (editingRow) {
            // Update existing row
            editingRow.querySelector(".file-name").textContent = name;
            editingRow.querySelector(".file-date").textContent = date;
            editingRow.querySelector(".file-type").textContent = type;
            editingRow.querySelector(".file-size").textContent = size;
            editingRow.dataset.fileContent = content;
            } else {
            // Create new row
            const row = document.createElement("div");
            row.classList.add("file-row");
            row.dataset.fileContent = content;
            row.innerHTML = `
                <input type="checkbox" class="file-select">
                <span class="file-name">${name}</span>
                <span class="file-date">${date}</span>
                <span class="file-type">${type}</span>
                <span class="file-size">${size}</span>
                <button class="edit-btn">Edit</button>
            `;
            fileRowsContainer.appendChild(row);

            // Edit button logic
            row.querySelector(".edit-btn").addEventListener("click", () => {
                editingRow = row;
                filePopupTitle.textContent = "Edit File";
                fileNameInput.value = row.querySelector(".file-name").textContent;
                fileContentInput.value = row.dataset.fileContent || "";
                filePopup.classList.remove("hidden");
            });
            }
            filePopup.classList.add("hidden");
        }
    });

    function getSelectedFileRows() {
        return Array.from(fileRowsContainer.querySelectorAll('.file-row')).filter(row => {
            const checkbox = row.querySelector('.file-select');
            return checkbox && checkbox.checked;
        });
    }

    let pendingDeleteRows = [];

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 2800);
    }

    function openDeleteConfirmation(selectedRows) {
        pendingDeleteRows = selectedRows;
        deleteConfirmMessage.textContent = `Delete ${selectedRows.length} selected file(s)? This action cannot be undone.`;
        fileDeleteConfirmation.classList.remove('hidden');
    }

    function closeDeleteConfirmation() {
        pendingDeleteRows = [];
        fileDeleteConfirmation.classList.add('hidden');
    }

    function removeSelectedFiles() {
        const selectedRows = getSelectedFileRows();
        if (selectedRows.length === 0) {
            showNotification('Please select at least one file to delete.');
            return;
        }

        openDeleteConfirmation(selectedRows);
    }

    cancelDeleteFileBtn.addEventListener('click', () => {
        closeDeleteConfirmation();
    });

    confirmDeleteFileBtn.addEventListener('click', () => {
        pendingDeleteRows.forEach(row => row.remove());
        closeDeleteConfirmation();
        showNotification('Selected file(s) deleted successfully.');
    });

    function printSelectedFiles() {
        const selectedRows = getSelectedFileRows();
        if (selectedRows.length === 0) {
            showNotification('Please select at least one file to send to the I/O simulation.');
            return;
        }

        selectedRows.forEach(row => {
            const fileName = row.querySelector('.file-name')?.textContent?.trim();
            if (fileName) {
                addToPrintQueue(fileName);
            }
            const checkbox = row.querySelector('.file-select');
            if (checkbox) checkbox.checked = false;
        });

        if (!isPrinting) {
            processQueue();
        }

        showNotification(`${selectedRows.length} file(s) queued for I/O simulation.`);
    }

    let selectedAlgorithm = 'FCFS';
    let currentProcesses = [];
    let isSimulating = false;
    let waitingTimes = [];
    let turnaroundTimes = [];
    let totalCpuTime = 0;
    let totalSimulationTime = 0;
    let ganttTimeline = [];
    let memoryPartitions = [
        { size: 256, allocated: false, process: null },
        { size: 256, allocated: false, process: null },
        { size: 256, allocated: false, process: null },
        { size: 256, allocated: false, process: null }
    ];

    //File System Popup
    let editingRow = null;

    //IO Simulation Variables
    let printQueue = [];
    let isPrinting = false;
    let isPaused = false;
    let successfulPrints = 0;
    let failedPrints = 0;

    // IO Part para sa add files
    function addToPrintQueue(fileName) {
        const duration = Math.floor(Math.random() * 16) + 5; // 5–20s
        const queueItem = {
            name: fileName,
            status: 'Ready',
            queueNumber: printQueue.length + 1,
            duration: duration,
            remaining: duration
        };
        printQueue.push(queueItem);
        renderPrintQueue();
    }

    // IO Part for Render Print Queue Table
    function renderPrintQueue() {
        const table = document.querySelector('.io-table');
        table.querySelectorAll('.print-row').forEach(row => row.remove());

        printQueue.forEach(item => {
            const row = document.createElement('div');
            row.className = 'print-row';
            row.innerHTML = `
                <p>${item.name}</p>
                <p>${item.status}</p>
                <p>${item.queueNumber}</p>
                <p>${item.remaining}s</p>
            `;
            if (item.status === 'Failed') {
                const fixBtn = document.createElement('button');
                fixBtn.textContent = 'Fix';
                fixBtn.addEventListener('click', () => {
                    item.status = 'Ready';
                    item.remaining = item.duration;
                    printQueue.push(item);
                    renderPrintQueue();
                });
                row.appendChild(fixBtn);
            }
            table.appendChild(row);
        });
    }

    // Simulation Loop
    async function processQueue() {
        if (isPrinting || isPaused) return;
        isPrinting = true;

        while (printQueue.length > 0 && !isPaused) {
            const current = printQueue[0];
            current.status = 'Printing';
            printerStatusEl.textContent = 'Unavailable';
            renderPrintQueue();

            while (current.remaining > 0 && !isPaused) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                current.remaining -= 1;
                renderPrintQueue();
            }

            if (!isPaused) {
                if (Math.random() < 0.4) {
                    current.status = 'Failed';
                    failedPrints++;
                    failedPrintsEl.textContent = failedPrints;
                } else {
                    current.status = 'Finished';
                    successfulPrints++;
                    successfulPrintsEl.textContent = successfulPrints;
                }
                printQueue.shift();
                printerStatusEl.textContent = 'Available';
                renderPrintQueue();
            }
        }

        isPrinting = false;
    }



    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function allocateMemory(process) {
        for (let i = 0; i < memoryPartitions.length; i++) {
            if (!memoryPartitions[i].allocated && memoryPartitions[i].size >= process.memory_size) {
                memoryPartitions[i].allocated = true;
                memoryPartitions[i].process = process;
                return true;
            }
        }
        return false;
    }

    function deallocateMemory(pid) {
        for (const partition of memoryPartitions) {
            if (partition.allocated && partition.process && partition.process.pid === pid) {
                partition.allocated = false;
                partition.process = null;
                break;
            }
        }
    }

    function renderMemoryHeatMap() {
        const container = document.querySelector('.memory-heat-map');
        if (!container) return;
        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.justifyContent = 'center';

        memoryPartitions.forEach((partition, index) => {
            const partitionDiv = document.createElement('div');
            partitionDiv.className = 'memory-partition';
            partitionDiv.style.width = '100px';
            partitionDiv.style.height = '100px';
            partitionDiv.style.border = '2px solid #ddd';
            partitionDiv.style.display = 'inline-flex';
            partitionDiv.style.flexDirection = 'column';
            partitionDiv.style.justifyContent = 'center';
            partitionDiv.style.alignItems = 'center';
            partitionDiv.style.margin = '5px';
            partitionDiv.style.textAlign = 'center';
            partitionDiv.style.fontSize = '12px';
            partitionDiv.style.fontFamily = 'Poppins';
            partitionDiv.style.borderRadius = '12px';
            partitionDiv.style.padding = '8px';
            partitionDiv.style.whiteSpace = 'pre-line';

            if (partition.allocated) {
                partitionDiv.style.backgroundColor = '#A55730';
                partitionDiv.style.color = '#fff';
                partitionDiv.textContent = `P${partition.process.pid}: ${partition.process.name}\n${partition.process.memory_size} MB`;
            } else {
                partitionDiv.style.backgroundColor = '#FDD496';
                partitionDiv.style.color = '#333';
                partitionDiv.textContent = `Free\n${partition.size} MB`;
            }

            container.appendChild(partitionDiv);
        });

        updateMemoryStats();
    }

    function formatMemoryValue(valueMb) {
        if (valueMb >= 1024) {
            return `${(valueMb / 1024).toFixed(1)} GB`;
        }
        return `${valueMb} MB`;
    }

    function updateMemoryStats() {
        const totalMemory = memoryPartitions.reduce((sum, partition) => sum + partition.size, 0);
        const usedMemory = memoryPartitions.reduce(
            (sum, partition) => sum + (partition.allocated ? partition.size : 0),
            0
        );
        const freeMemory = totalMemory - usedMemory;

        const usedEl = document.getElementById('memory-used');
        const freeEl = document.getElementById('memory-available');

        if (usedEl) {
            usedEl.textContent = formatMemoryValue(usedMemory);
        }
        if (freeEl) {
            freeEl.textContent = formatMemoryValue(freeMemory);
        }
    }

    function createProcessRow(process) {
        const row = document.createElement('div');
        row.className = 'process-row';
        row.dataset.pid = process.pid;
        if (process.state === 'Finished') {
            row.classList.add('finished');
        }
        row.innerHTML = `
            <p>${process.pid}</p>
            <p>${process.name}</p>
            <p>${process.burst_time} ms</p>
            <p class="process-state">${process.state}</p>
        `;
        return row;
    }

    function renderProcesses(processes) {
        currentProcesses = processes;
        tableData.innerHTML = '';

        if (!processes || processes.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.className = 'process-empty';
            emptyState.textContent = 'No processes added yet. Tap Add Process to begin.';
            tableData.appendChild(emptyState);
            return;
        }

        processes.forEach((process) => {
            tableData.appendChild(createProcessRow(process));
        });
    }

    function getRow(pid) {
        return tableData.querySelector(`.process-row[data-pid="${pid}"]`);
    }

    function updateRowState(pid, state) {
        const row = getRow(pid);
        if (!row) return;
        const stateCell = row.querySelector('.process-state');
        stateCell.textContent = state;
        row.classList.remove('running', 'waiting', 'finished');
        if (state === 'Running') row.classList.add('running');
        if (state === 'Waiting') row.classList.add('waiting');
        if (state === 'Finished') row.classList.add('finished');
    }

    function updateRowBurstTime(pid, value) {
        const row = getRow(pid);
        if (!row) return;
        const burstCell = row.querySelector('p:nth-child(3)');
        burstCell.textContent = `${value} ms`;
    }

    function resetRowStyling() {
        const rows = tableData.querySelectorAll('.process-row');
        rows.forEach((row) => {
            row.classList.remove('running', 'waiting');
            const stateCell = row.querySelector('.process-state');
            if (stateCell && !row.classList.contains('finished')) {
                stateCell.textContent = 'Ready';
            }
        });
    }

    function updateProcessStats() {
        const activeJobs = currentProcesses.filter(proc => proc.burst_time > 0).length;
        const totalProcesses = currentProcesses.length;
        const cpuLoad = totalProcesses ? ((activeJobs / totalProcesses) * 100).toFixed(0) : 0;
        const memoryUsage = Math.min(100, (totalProcesses * 5) + (activeJobs * 10)); // Simple simulation

        document.querySelector('.stat:nth-child(1) h2').textContent = cpuLoad + '%';
        document.querySelector('.stat:nth-child(2) h2').textContent = memoryUsage + '%';
        document.querySelector('.stat:nth-child(3) h2').textContent = activeJobs;
    }

    function updateProcessCalculations(cpuUtilization, avgTurnaroundTime, avgWaitingTime) {
        document.querySelector('.calculation-item:nth-child(1) h2').textContent = cpuUtilization + '%';
        document.querySelector('.calculation-item:nth-child(2) h2').textContent = avgTurnaroundTime + ' ms';
        document.querySelector('.calculation-item:nth-child(3) h2').textContent = avgWaitingTime + ' ms';
    }

    function renderGanttChart() {
        const ganttContainer = document.querySelector('.gantt-chart-container');
        ganttContainer.innerHTML = '';

        // Use the timeline tracked during simulation
        if (!ganttTimeline || ganttTimeline.length === 0) return;

        const totalTime = ganttTimeline[ganttTimeline.length - 1].end;
        const scale = Math.max(100, totalTime * 20) / totalTime;
        const colors = ['#FDD496', '#D59C6F', '#A55730', '#5B5F7C', '#6F513A', '#C05741'];

        // Apply layout styles directly to the container
        ganttContainer.style.display = 'flex';
        ganttContainer.style.flexDirection = 'column';
        ganttContainer.style.gap = '8px';
        ganttContainer.style.fontFamily = 'Poppins';
        ganttContainer.style.overflowX = 'auto'; // Ensures horizontal scrolling
        ganttContainer.style.padding = '1.5em';

        // === MAIN BAR ROW ===
        const barRow = document.createElement('div');
        barRow.style.cssText = `
            display: flex;
            min-width: max-content;
            height: 45px;
            border: 1px solid #ddd;
            border-radius: 10px;
            overflow: hidden;
        `;

        ganttTimeline.forEach((slice) => {
            const duration = slice.end - slice.start;
            const bar = document.createElement('div');
            
            bar.style.cssText = `
                flex-shrink: 0;
                width: ${duration * scale}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 12px;
                background: ${colors[slice.pid % colors.length]};
                border-right: 1px solid rgba(0,0,0,0.1);
                color: #333;
            `;
            bar.textContent = slice.name;
            barRow.appendChild(bar);
        });

        // === TIME AXIS ROW ===
        const timeRow = document.createElement('div');
        timeRow.style.cssText = `
            display: flex;
            min-width: max-content;
            font-size: 11px;
            color: #666;
        `;

        ganttTimeline.forEach((slice, index) => {
            const duration = slice.end - slice.start;
            const timeBlock = document.createElement('div');
            
            timeBlock.style.flexShrink = '0';
            timeBlock.style.width = `${duration * scale}px`;
            timeBlock.textContent = slice.start;

            timeRow.appendChild(timeBlock);

            // Add the final timestamp at the end of the timeline
            if (index === ganttTimeline.length - 1) {
                const endLabel = document.createElement('div');
                endLabel.textContent = slice.end;
                endLabel.style.paddingLeft = '4px';
                timeRow.appendChild(endLabel);
            }
        });

        // Append rows directly to the container[cite: 2]
        ganttContainer.appendChild(barRow);
        ganttContainer.appendChild(timeRow);
    }

    function renderWaitingTimeGraph(waitingTimes) {
        const container = document.querySelector('.waiting-time-container');
        container.innerHTML = '';

        if (!waitingTimes || waitingTimes.length === 0) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '160');
        svg.setAttribute('viewBox', '0 0 400 200');
        svg.style.border = '1px solid #ddd';
        svg.style.borderRadius = '10px';
        svg.style.backgroundColor = '#f9f9f9';

        const maxWaiting = Math.max(...waitingTimes);
        const padding = 20;
        const width = 400;
        const height = 200 - 2 * padding;
        const scaleX = (width - 2 * padding) / (waitingTimes.length - 1 || 1);
        const scaleY = height / (maxWaiting || 1);

        // Draw axes
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding);
        xAxis.setAttribute('y1', height + padding);
        xAxis.setAttribute('x2', width - padding);
        xAxis.setAttribute('y2', height + padding);
        xAxis.setAttribute('stroke', '#000');
        xAxis.setAttribute('stroke-width', '1');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding);
        yAxis.setAttribute('y1', padding);
        yAxis.setAttribute('x2', padding);
        yAxis.setAttribute('y2', height + padding);
        yAxis.setAttribute('stroke', '#000');
        yAxis.setAttribute('stroke-width', '1');
        svg.appendChild(yAxis);

        // Add y-axis ticks
        const numTicks = 5;
        for (let i = 0; i <= numTicks; i++) {
            const value = (maxWaiting * i) / numTicks;
            const y = height + padding - (value * scaleY);
            const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tick.setAttribute('x1', padding - 5);
            tick.setAttribute('y1', y);
            tick.setAttribute('x2', padding);
            tick.setAttribute('y2', y);
            tick.setAttribute('stroke', '#000');
            tick.setAttribute('stroke-width', '1');
            svg.appendChild(tick);

            const tickLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            tickLabel.setAttribute('x', padding - 10);
            tickLabel.setAttribute('y', y + 3);
            tickLabel.setAttribute('text-anchor', 'end');
            tickLabel.setAttribute('font-family', 'Poppins');
            tickLabel.setAttribute('font-size', '10px');
            tickLabel.setAttribute('fill', '#333');
            tickLabel.textContent = Math.round(value);
            svg.appendChild(tickLabel);
        }

        // Draw line
        let pathData = '';
        waitingTimes.forEach((wt, index) => {
            const x = padding + index * scaleX;
            const y = height + padding - wt * scaleY;
            if (index === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
        });

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', '#A55730');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        // Draw points
        waitingTimes.forEach((wt, index) => {
            const x = padding + index * scaleX;
            const y = height + padding - wt * scaleY;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', '#A55730');
            svg.appendChild(circle);

            // Add value label
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x);
            label.setAttribute('y', y - 10);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-family', 'Poppins');
            label.setAttribute('font-size', '10px');
            label.setAttribute('fill', '#333');
            label.textContent = wt;
            svg.appendChild(label);

            // Add x-axis process label
            const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            xLabel.setAttribute('x', x);
            xLabel.setAttribute('y', height + padding + 15);
            xLabel.setAttribute('text-anchor', 'middle');
            xLabel.setAttribute('font-family', 'Poppins');
            xLabel.setAttribute('font-size', '10px');
            xLabel.setAttribute('fill', '#333');
            xLabel.textContent = `P${index + 1}`;
            svg.appendChild(xLabel);
        });

        container.appendChild(svg);
    }

    function setAlgorithmSelection() {
        algorithmSpans.forEach((span) => {
            const isActive = span.dataset.algo === selectedAlgorithm;
            span.classList.toggle('active', isActive);
        });
    }

    async function simulateFCFS(processes, quantum, currentTime) {
        const queue = processes
            .filter((proc) => proc.burst_time > 0)
            .map((proc) => ({ ...proc }));

        while (queue.length > 0 && isSimulating) {
            const current = queue.shift();

            // Check if memory is allocated, if not, try to allocate
            const isAllocated = memoryPartitions.some(p => p.allocated && p.process && p.process.pid === current.pid);
            if (!isAllocated) {
                if (!allocateMemory(current)) {
                    // Memory full, put back in queue to wait
                    queue.push(current);
                    continue;
                }
                renderMemoryHeatMap();
            }

            // Run the process to completion
            if (current.startTime === null) {
                current.startTime = currentTime;
            }
            currentProcesses.forEach((proc) => {
                if (proc.pid === current.pid) {
                    updateRowState(proc.pid, 'Running');
                } else if (proc.burst_time > 0) {
                    updateRowState(proc.pid, 'Waiting');
                }
            });
            await sleep(900);

            // Record gantt slice
            ganttTimeline.push({
                pid: current.pid,
                name: current.name,
                start: currentTime,
                end: currentTime + current.burst_time
            });

            current.finishTime = currentTime + current.burst_time;
            currentTime += current.burst_time;
            const currentProcess = currentProcesses.find((proc) => proc.pid === current.pid);
            if (currentProcess) {
                currentProcess.burst_time = 0;
                currentProcess.state = 'Finished';
            }
            updateRowBurstTime(current.pid, 0);
            updateRowState(current.pid, 'Finished');

            // Deallocate memory when finished
            deallocateMemory(current.pid);
            renderMemoryHeatMap();

            // Calculate metrics
            const waitingTime = current.startTime - current.arrivalTime;
            const turnaroundTime = current.finishTime - current.arrivalTime;
            waitingTimes.push(waitingTime);
            turnaroundTimes.push(turnaroundTime);
            totalCpuTime += current.originalBurstTime;

            renderGanttChart();
            await sleep(300);
        }
        totalSimulationTime = currentTime;
        resetRowStyling();
    }

    async function simulateRoundRobin(processes, quantum, currentTime) {
        const queue = processes
            .filter((proc) => proc.burst_time > 0)
            .map((proc) => ({ ...proc, remaining: proc.burst_time }));

        while (queue.length > 0 && isSimulating) {
            const current = queue.shift();

            // Check if memory is allocated, if not, try to allocate
            const isAllocated = memoryPartitions.some(
                (p) => p.allocated && p.process && p.process.pid === current.pid
            );
            if (!isAllocated) {
                if (!allocateMemory(current)) {
                    // Memory full: the process must wait until another process frees a partition
                    updateRowState(current.pid, 'Waiting');
                    queue.push(current);

                    const anyAllocatable = queue.some((proc) =>
                        memoryPartitions.some((partition) => !partition.allocated && partition.size >= proc.memory_size)
                    );
                    if (!anyAllocatable) {
                        // Idle until a partition becomes free
                        await sleep(500);
                    }
                    continue;
                }
                renderMemoryHeatMap();
            }

            if (current.startTime === null) {
                current.startTime = currentTime;
            }
            const runLength = Math.min(current.remaining, quantum);
            currentProcesses.forEach((proc) => {
                if (proc.pid === current.pid) {
                    updateRowState(proc.pid, 'Running');
                } else if (proc.burst_time > 0) {
                    updateRowState(proc.pid, 'Waiting');
                }
            });
            await sleep(900);

            // Record gantt slice BEFORE incrementing time
            ganttTimeline.push({
                pid: current.pid,
                name: current.name,
                start: currentTime,
                end: currentTime + runLength
            });

            current.remaining -= runLength;
            currentTime += runLength;
            const currentProcess = currentProcesses.find((proc) => proc.pid === current.pid);
            if (currentProcess) {
                currentProcess.burst_time = Math.max(0, current.remaining);
                updateRowBurstTime(current.pid, currentProcess.burst_time);
            }

            if (current.remaining > 0) {
                queue.push(current);
                updateRowState(current.pid, 'Waiting');
            } else {
                current.finishTime = currentTime;
                if (currentProcess) {
                    currentProcess.state = 'Finished';
                }
                updateRowState(current.pid, 'Finished');

                // Deallocate memory when finished
                deallocateMemory(current.pid);
                renderMemoryHeatMap();

                // Calculate metrics
                const waitingTime = current.finishTime - current.arrivalTime - current.originalBurstTime;
                const turnaroundTime = current.finishTime - current.arrivalTime;
                waitingTimes.push(waitingTime);
                turnaroundTimes.push(turnaroundTime);
                totalCpuTime += current.originalBurstTime;
            }
            
            // Render Gantt chart in real-time
            renderGanttChart();
            await sleep(300);
        }
        totalSimulationTime = currentTime;
        resetRowStyling();
    }

    async function startSimulation() {
        if (isSimulating) return;

        if (!currentProcesses.length) {
            alert('Add at least one process before starting the simulation.');
            return;
        }

        // ✅ Reset Gantt timeline (VERY IMPORTANT)
        ganttTimeline = [];

        // ✅ Reset waiting time graph
        document.querySelector('.waiting-time-container').innerHTML = '';

        // ✅ Reset metrics
        waitingTimes = [];
        turnaroundTimes = [];
        totalCpuTime = 0;
        totalSimulationTime = 0;

        // ✅ Reset processes locally ONLY (no fetch overwrite)
        currentProcesses.forEach((proc) => {
            proc.burst_time = proc.original_burst_time ?? proc.burst_time;
            proc.state = 'Ready';
        });

        // ✅ Reset memory partitions
        memoryPartitions.forEach((p) => {
            p.allocated = false;
            p.process = null;
        });
        renderMemoryHeatMap();

        // ✅ Re-render UI immediately
        renderProcesses(currentProcesses);

        isSimulating = true;
        startSimulationButton.disabled = true;
        resetProcessesButton.disabled = true;

        try {
            const processesCopy = currentProcesses.map((proc) => ({
                ...proc,
                arrivalTime: 0,
                startTime: null,
                finishTime: null,
                originalBurstTime: proc.original_burst_time ?? proc.burst_time,
            }));

            const quantum = Number(timeQuantumInput.value) || 50;
            let currentTime = 0;

            if (selectedAlgorithm === 'FCFS') {
                await simulateFCFS(processesCopy, quantum, currentTime);
            } else {
                await simulateRoundRobin(processesCopy, quantum, currentTime);
            }

            // ✅ Compute averages
            const avgWaitingTime = waitingTimes.length
                ? (waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length).toFixed(2)
                : 0;

            const avgTurnaroundTime = turnaroundTimes.length
                ? (turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length).toFixed(2)
                : 0;

            const cpuUtilization = totalSimulationTime
                ? ((totalCpuTime / totalSimulationTime) * 100).toFixed(2)
                : 0;

            updateProcessStats();
            updateProcessCalculations(cpuUtilization, avgTurnaroundTime, avgWaitingTime);

            // ✅ Final Gantt render
            renderGanttChart();

            // ✅ Render waiting time graph
            renderWaitingTimeGraph(waitingTimes);

        } finally {
            isSimulating = false;
            startSimulationButton.disabled = false;
            resetProcessesButton.disabled = false;
        }
    }

    async function resetProcesses() {
        if (isSimulating) {
            alert('Wait for the current simulation to finish before resetting.');
            return;
        }

        try {
            const response = await fetch('/processes/reset', { method: 'POST' });
            if (!response.ok) throw new Error('Unable to reset processes');
            await loadProcesses();
            memoryPartitions.forEach((p) => {
                p.allocated = false;
                p.process = null;
            });
            renderMemoryHeatMap();
        } catch (error) {
            console.error(error);
            alert('Failed to reset processes.');
        }
    }

    function openPopup() {
        popup.classList.remove('hidden');
        nameInput.focus();
    }

    function closePopup() {
        popup.classList.add('hidden');
        nameInput.value = '';
        burstInput.value = '';
        memoryInput.value = '';
    }

    async function submitProcess() {
        const name = nameInput.value.trim();
        const burstTime = Number(burstInput.value);
        const memorySize = Number(memoryInput.value);

        if (!name || !Number.isFinite(burstTime) || burstTime <= 0 || !Number.isFinite(memorySize) || memorySize <= 0) {
            alert('Please enter a valid name, burst time, and memory size greater than zero.');
            return;
        }

        try {
            const response = await fetch('/processes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    burst_time: burstTime,
                    memory_size: memorySize,
                }),
            });

            if (!response.ok) {
                const body = await response.json();
                throw new Error(body.error || 'Unable to create process');
            }

            await loadProcesses();
            closePopup();
        } catch (error) {
            console.error(error);
            alert(error.message || 'Failed to create process.');
        }
    }

    async function loadProcesses() {
        try {
            const response = await fetch('/processes');
            if (!response.ok) throw new Error('Unable to load processes');
            const data = await response.json();
            renderProcesses(data.processes || []);
            setAlgorithmSelection();
            updateProcessStats();
            renderMemoryHeatMap();
        } catch (error) {
            console.error(error);
            renderProcesses([]);
            renderMemoryHeatMap();
        }
    }

    playBtn.addEventListener('click', () => {
        isPaused = false;
        processQueue();
    });

    pauseBtn.addEventListener('click', () => {
        isPaused = true;
        printerStatusEl.textContent = 'Paused';
    });

    resetBtn.addEventListener('click', () => {
        printQueue = [];
        successfulPrints = 0;
        failedPrints = 0;
        printerStatusEl.textContent = 'Available';
        successfulPrintsEl.textContent = successfulPrints;
        failedPrintsEl.textContent = failedPrints;
        renderPrintQueue();
    });

    addProcessButton.addEventListener('click', openPopup);
    cancelButton.addEventListener('click', closePopup);
    submitButton.addEventListener('click', submitProcess);
    startSimulationButton.addEventListener('click', startSimulation);
    resetProcessesButton.addEventListener('click', resetProcesses);
    removeBtn.addEventListener('click', removeSelectedFiles);
    printBtn.addEventListener('click', printSelectedFiles);

    algorithmSpans.forEach((span) => {
        span.addEventListener('click', () => {
            selectedAlgorithm = span.dataset.algo;
            setAlgorithmSelection();
        });
    });

    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            closePopup();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !popup.classList.contains('hidden')) {
            closePopup();
        }
    });

    loadProcesses();
});
