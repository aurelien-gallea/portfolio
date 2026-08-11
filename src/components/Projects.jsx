import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import './Projects.css';

const projectsData = [
  {
    id: 14,
    title: 'Zombie Rules',
    link: '/survival-game/',
    image: './image/zombie-rules.jpg',
  },
  {
    id: 13,
    title: 'CineTech',
    link: '/cinetech-react/',
    image: './image/cinetech.jpg',
  },
  {
    id: 8,
    title: 'Pokémon Finder',
    link: '/pkmnfinder/',
    image: './image/pikachu.avif',
  },
  {
    id: 12,
    title: 'DanyPiano',
    link: 'https://danypiano.fr',
    image: './image/danypiano.jpg',
  },
  {
    id: 1,
    title: 'Le Pendu',
    link: 'https://eclatdevweb.github.io/projet-passerelle-1/',
    image: './image/pendu.png',
  }
];

const ProjectCard = ({ project, index }) => {
  const cardContent = (
    <motion.div 
      className="project-card"
      style={{ textDecoration: 'none' }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.03, zIndex: 10 }}
    >
      <div className="project-image-container">
        <img src={project.image} alt={project.title} className="project-img" />
      </div>
      <div className="project-info">
        <h4>{project.title}</h4>
      </div>
    </motion.div>
  );

  if (project.link.startsWith('http')) {
    return (
      <a href={project.link} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={project.link} style={{ textDecoration: 'none' }}>
      {cardContent}
    </Link>
  );
};

const Projects = () => {
  return (
    <section id="projets" className="projects-section">
      <div className="container">
        <motion.div 
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Créations</h2>
          <h3>Découvrez quelques-uns de mes projets</h3>
        </motion.div>
        
        <div className="projects-grid">
          {projectsData.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
