const express = require('express')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const log = require('./utils/logger')

const app = express()
const PORT = 3000

const db_path = path.join(__dirname, 'tarefas.json')

const loadTasks = async () => {
    const data = await fsPromises.readFile(db_path, 'utf-8')
    return JSON.parse(data)
}

const saveTasks = async (tasks) => {
    await fsPromises.writeFile(db_path, JSON.stringify(tasks, null, 2))
}

app.get('/tarefas', async (req, res) => {
    try {
        let tasks = await loadTasks()
        const { sprint, responsavel, limit = 10 } = req.query

        if (sprint) tasks = tasks.filter(task => task.sprint === sprint)
        if (responsavel) tasks = tasks.filter(task => task.responsavel === responsavel)

        res.json(tasks.slice(0, limit))
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar tarefas' })
    }
})

app.get('/tarefas/:id', async (req, res) => {
    const tasks = await loadTasks()
    const task = tasks.find(task => task.id === req.params.id)
    if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' })
    res.json(task)
})

app.post('/tarefas', async (req, res) => {
    const newTask = req.body
    const required = ['id', 'titulo', 'descricao', 'concluida', 'responsavel', 'prazo', 'sprint', 'prioridade']

    if (!required.every(field => field in newTask)) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.'})
    }

    const tasks = await loadTasks()
    tasks.push(newTask)
    await saveTasks(tasks)

    log(`Tarefa criada: ${newTask.titulo}`)
    res.status(201).json(newTask)
})

app.put('/tarefas/:id', async (req, res) => {
    const id = Number(req.params.id)
    const newTask = req.body

    const tasks = await loadTasks()
    const index = tasks.findIndex(task => task.id === id)
    if (index === -1) return res.status(404).json({ error: 'Tarefa não encontrada' })

    tasks[index] = newTask
    await saveTasks(tasks)

    log(`Tarefa atualizada: ID ${id}`)
    res.json(newTask)
})

app.delete('/tarefas/:id', async (req, res) => {
    const id = Number(req.params.id)
    const tasks = await loadTasks()
    const newList = tasks.filter(task => task.id !== id)

    if (newList.legnth === tasks.length) return res.status(404).json({ error: 'Tarefa não encontrada' })
    await saveTasks(newList)
    log(`Tarefa deletada: ID ${id}`)
    res.status(204).send()
})

app.delete('/tarefas/responsavel/:responsavel', async (req, res) => {
    const responsavel = req.params.responsavel
    const tasks = await loadTasks()
    const newTasks = tasks.filter(task => task.responsavel !== responsavel)

    if (newTasks.length === tasks.length) return res.status(404).json({ error: 'Nenhuma tarefa encontrada para esse responsável.' })
    
    await saveTasks(newTasks)
    log(`Tarefas deletadas para o responsável: ${responsavel}`)
    res.status(204).send()
})

app.patch('/tarefas/:id/concluir', async (req, res) => {
    const id = Number(req.params.id)
    const tasks = await loadTasks()
    const index = tasks.findIndex(task => task.id === id)

    if (index === -1) return res.status(404).json({ error: 'Tarefa não encontrada' })

    tasks[index].concluida = true
    await saveTasks(tasks)

    log(`Tarefa concluída: ID ${id}`)
    res.json({ message: 'Tarefa marcada como concluída.' })
})

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`)
})