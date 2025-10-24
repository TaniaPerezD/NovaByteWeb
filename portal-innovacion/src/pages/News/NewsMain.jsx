import React, { useState, useEffect, useRef } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import News from '../../components/News/News';
import Sidebar from '../../components/News/SideBar';
import Pagination from '../../components/News/Pagination';
import ButtonWithArrow from '../../components/Forms/ButtonWithArrow';
import Modal from '../../components/Forms/Modal';
import NoticiasFormComponent from '../../components/Forms/Formularios/NoticiasForm';
import blogImg1 from '../../assets/img/blog/blog-sidebar-1.jpg';
import blogImg2 from '../../assets/img/blog/blog-sidebar-2.jpg';
import blogImg3 from '../../assets/img/blog/blog-sidebar-3.jpg';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { getNews } from '../../redux/noticias/thunk';

const NewsMain = () => {
  const userState = useSelector((state) => state.users);
  const noticiasState = useSelector((state) => state.noticias)
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(getNews(5, 1))
  }, [dispatch])
  

    // const allNewsData = [
    //     {
    //     id: 1,
    //     blogImages: [blogImg1, blogImg2],
    //     publishedDate: "April 20, 2024",
    //     authorName: "Author One",
    //     title: "Title for News 1",
    //     btnText: "Read More",
    //     tags: ["Tag1", "Tag3"],
    //     paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
    //     },
    //     {
    //     id: 2,
    //     blogImages: [blogImg2, blogImg3],
    //     publishedDate: "April 21, 2024",
    //     authorName: "Author Two",
    //     title: "Title for News 2",
    //     btnText: "Read More",
    //     tags: ["Tag2"],
    //     paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
    //     },
    //     {
    //     id: 3,
    //     blogImages: [blogImg3],
    //     publishedDate: "April 22, 2024",
    //     authorName: "Author Three",
    //     title: "Title for News 3",
    //     btnText: "Read More",
    //     tags: ["Tag1"],
    //     paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
    //     },
    //     {
    //     id: 4,
    //     blogImages: [blogImg1],
    //     publishedDate: "April 23, 2024",
    //     authorName: "Author Four",
    //     title: "Title for News 4",
    //     btnText: "Read More",
    //     tags: ["Tag3"],
    //     paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
    //     },
    //     {
    //     id: 5,
    //     blogImages: [blogImg2],
    //     publishedDate: "April 24, 2024",
    //     authorName: "Author Five",
    //     title: "Title for News 5",
    //     btnText: "Read More",
    //     tags: ["Tag2"],
    //     paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
    //     },   
    // ];

 
    // const [filteredNews, setFilteredNews] = useState(allNewsData);
    const [currentPage, setCurrentPage] = useState(1);
    // const [searchQuery, setSearchQuery] = useState('');
    // const [selectedTags, setSelectedTags] = useState([]);
    const newsPerPage = 5;
    const [isNoticiasModalOpen, setIsNoticiasModalOpen] = useState(false);

    const toggleNoticiasModal = () => {
      setIsNoticiasModalOpen(!isNoticiasModalOpen);
    };

    const closeNoticiasModal = () => {
      setIsNoticiasModalOpen(false);
    };
  
    const contentRef = useRef(null);
  
    useEffect(() => {
      // const lowerQuery = searchQuery.toLowerCase();
  
      // const results = allNewsData.filter((news) => {
      //   const matchesQuery =
      //     news.title.toLowerCase().includes(lowerQuery) ||
      //     news.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
  
      //   const matchesTags =
      //     selectedTags.length === 0 || selectedTags.every((tag) => news.tags.includes(tag));
  
      //   return matchesQuery && matchesTags;
      // });
  
      // setFilteredNews(results);
      setCurrentPage(1);
    }, []);
  
    // const handleSearch = (query) => {
    //   setSearchQuery(query);
    // };
  
    // const handleTagClick = (tag) => {
    //   setSelectedTags((prevTags) =>
    //     prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    //   );
    // };
  
    const paginate = (pageNumber) => {
      console.log("Paginate" + pageNumber)
      setCurrentPage(pageNumber);
      
      dispatch(getNews(5, pageNumber))

      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  
    // const indexOfLastNews = currentPage * newsPerPage;
    // const indexOfFirstNews = indexOfLastNews - newsPerPage;
    // const currentNews = filteredNews.slice(indexOfFirstNews, indexOfLastNews);
  
    return (
      <main>
        <Breadcrumb title="Noticias" subTitle="noticias" />
  
        <div ref={contentRef} className="postbox__area pt-120 pb-120">
          <div className="container">
          {
                  (userState.rol && (userState.rol === "administrativo" || userState.rol === "Administrador" || userState.rol === "administrativo"))
                  ? 
                  (
                    <div className="container">
                    <ButtonWithArrow text="Nueva Noticia" onClick={toggleNoticiasModal} />
                    <Modal isOpen={isNoticiasModalOpen} onClose={toggleNoticiasModal}>
                        <NoticiasFormComponent onSuccess={closeNoticiasModal}/>
                    </Modal>
                    
                    </div>
                  )
                  :
                  (<></>)
                }
                <div style={{ marginBottom: '30px' }}></div>
            <div className="row">
              <div className="col-xl-8 col-lg-8 mb-40">
                <div className="postbox__details-wrapper">
                  {/* <p>
                    Resultado de la búsqueda:{' '}
                    {searchQuery ? `"${searchQuery}"` : 'Todas las noticias'}
                  </p>
                  <p>
                    Filtrado por las categorías:{' '}
                    {selectedTags.length > 0
                      ? selectedTags.join(', ')
                      : 'Ninguna categoría seleccionada'}
                  </p> */}
  
                  {noticiasState.noticias.length > 0 ? (
                    noticiasState.noticias.map((news) => <News key={news.id} blogImages={[blogImg1, blogImg2, blogImg3]} news={news} />)
                  ) : (
                    <p>No hay resultados para su búsqueda.</p>
                  )}
                </div>
                {noticiasState.total > newsPerPage && (
                  <Pagination
                    totalItems={noticiasState.total}
                    itemsPerPage={newsPerPage}
                    currentPage={currentPage}
                    onPageChange={paginate}
                  />
                )}
              </div>
  
              {/* <div className="col-xxl-4 col-xl-4 col-lg-4">
                <Sidebar
                  posts={allNewsData}
                  tags={['Tag1', 'Tag2', 'Tag3', 'Tag4']}
                  onSearch={handleSearch}
                  onTagClick={handleTagClick}
                  selectedTags={selectedTags}
                />
              </div> */}
            </div>
          </div>
        </div>
      </main>
    );
};export default NewsMain;