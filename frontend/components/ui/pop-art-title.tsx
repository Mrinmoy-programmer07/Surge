"use client"

interface PopArtTitleProps {
    children: string
    className?: string
    size?: "sm" | "md" | "lg"
}

export default function PopArtTitle({ children, className = "", size = "lg" }: PopArtTitleProps) {
    const sizeClasses = {
        sm: "text-2xl md:text-3xl",
        md: "text-3xl md:text-4xl",
        lg: "text-5xl md:text-6xl"
    }

    const textSize = sizeClasses[size]

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Shadow layers for pop art 3D effect */}
            <h2
                className={`${textSize} font-black uppercase tracking-tight text-transparent select-none absolute`}
                style={{
                    WebkitTextStroke: '2px #ff0080',
                    transform: 'translate(6px, 6px)',
                    opacity: 0.3
                }}
                aria-hidden="true"
            >
                {children}
            </h2>
            <h2
                className={`${textSize} font-black uppercase tracking-tight text-transparent select-none absolute`}
                style={{
                    WebkitTextStroke: '2px #00f0ff',
                    transform: 'translate(3px, 3px)',
                    opacity: 0.5
                }}
                aria-hidden="true"
            >
                {children}
            </h2>
            {/* Main text */}
            <h2
                className={`${textSize} font-black uppercase tracking-tight relative`}
                style={{
                    background: 'linear-gradient(135deg, #00f0ff 0%, #ffffff 50%, #ff0080 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    WebkitTextStroke: '1px rgba(255,255,255,0.3)',
                    filter: 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.4))'
                }}
            >
                {children}
            </h2>
        </div>
    )
}
