import * as THREE from 'three'

export function initInterface(scene, camera, renderer) {
    // UI Container
    const uiGroup = new THREE.Group()
    scene.add(uiGroup)

    // Social Post Class
    class SocialPost {
        constructor(text, position) {
            const canvas = document.createElement('canvas')
            canvas.width = 512
            canvas.height = 256
            const ctx = canvas.getContext('2d')

            // Stylish cyberpunk design
            ctx.fillStyle = 'rgba(20, 20, 30, 0.9)'
            ctx.fillRect(0, 0, 512, 256)
            ctx.strokeStyle = '#00ffff'
            ctx.lineWidth = 4
            ctx.strokeRect(10, 10, 492, 236)

            ctx.fillStyle = '#00ffff'
            ctx.font = 'bold 24px monospace'
            ctx.fillText(text, 20, 50)

            const texture = new THREE.CanvasTexture(canvas)
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            })
            const geometry = new THREE.PlaneGeometry(5, 2.5)
            this.mesh = new THREE.Mesh(geometry, material)
            this.mesh.position.copy(position)
            uiGroup.add(this.mesh)
        }
    }

    // Create sample posts
    const posts = [
        new SocialPost("Welcome to CyberSpace!", new THREE.Vector3(5, 2, -5)),
        new SocialPost("Latest Neon Tech Drop", new THREE.Vector3(-5, 2, -5))
    ]

    // Interactive cursor
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    document.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    })

    document.addEventListener('click', () => {
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(uiGroup.children)
        if (intersects.length > 0) {
            console.log('Post clicked:', intersects[0].object)
            // Add interaction logic here
        }
    })

    return {
        update: () => {
            // Make posts face camera
            uiGroup.children.forEach(post => {
                post.lookAt(camera.position)
            })

            // Hover effect
            raycaster.setFromCamera(mouse, camera)
            const intersects = raycaster.intersectObjects(uiGroup.children)
            uiGroup.children.forEach(post => {
                post.scale.set(1, 1, 1)
            })
            if (intersects.length > 0) {
                intersects[0].object.scale.set(1.1, 1.1, 1.1)
            }
        }
    }
}