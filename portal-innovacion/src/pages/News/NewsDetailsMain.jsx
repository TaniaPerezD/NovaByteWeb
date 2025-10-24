import React, { useEffect, useState } from 'react';
import Breadcrumb from '../../components/Breadcrumb';
import {RecentPosts} from '../../components/News/SideBar';
import { useParams } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import blogImg1 from '../../assets/img/blog/blog-sidebar-1.jpg';
import blogImg2 from '../../assets/img/blog/blog-sidebar-2.jpg';
import blogImg3 from '../../assets/img/blog/blog-sidebar-3.jpg';
import { getNewById, getNews } from '../../redux/noticias/thunk';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const NewsDetailsMain = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  // const newsId = parseInt(id, 10); 

  // const allNewsData = [
  //   {
  //   id: 1,
  //   blogImages: [blogImg1, blogImg2],
  //   publishedDate: "April 20, 2024",
  //   authorName: "Author One",
  //   title: "Title for News 1",
  //   btnText: "Read More",
  //   tags: ["Tag1", "Tag3"],
  //   paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
  //   },
  //   {
  //   id: 2,
  //   blogImages: [blogImg2, blogImg3],
  //   publishedDate: "April 21, 2024",
  //   authorName: "Author Two",
  //   title: "Title for News 2",
  //   btnText: "Read More",
  //   tags: ["Tag2"],
  //   paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
  //   },
  //   {
  //   id: 3,
  //   blogImages: [blogImg3],
  //   publishedDate: "April 22, 2024",
  //   authorName: "Author Three",
  //   title: "Title for News 3",
  //   btnText: "Read More",
  //   tags: ["Tag1"],
  //   paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
  //   },
  //   {
  //   id: 4,
  //   blogImages: [blogImg1],
  //   publishedDate: "April 23, 2024",
  //   authorName: "Author Four",
  //   title: "Title for News 4",
  //   btnText: "Read More",
  //   tags: ["Tag3"],
  //   paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
  //   },
  //   {
  //   id: 5,
  //   blogImages: [blogImg2],
  //   publishedDate: "April 24, 2024",
  //   authorName: "Author Five",
  //   title: "Title for News 5",
  //   btnText: "Read More",
  //   tags: ["Tag2"],
  //   paragraph: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed sit amet accumsan arcu. Nullam sit amet nisi nec nunc tincidunt ultricies. Nullam sit amet",
  //   },   
  // ];

  const noticia = useSelector((state) => state.noticias.noticiaId)

  useEffect(() => {
    dispatch(getNewById(id));
  }, [dispatch, id]);
  
  if (!noticia) {
    return <p>Noticia no encontrada.</p>;
  }
  
  return (
    <main>
      <Breadcrumb title="Noticia" subTitle="Noticia" />
  
      <div className="postbox__area fix pt-120 pb-120">
        <div className="container">
          <div className="row">
            <div className="col-xxl-8 col-xl-8 col-lg-8">
              <div className="postbox__details-wrapper">
                <article>
                  <div className="postbox__thumb mb-30 w-img">
                    <img src={blogImg1} alt={noticia.title} />
                  </div>
                  <div className="postbox__details-title-box pb-40">
                    <div className="postbox__meta">
                      <span>
                        <i className="fa-solid fa-calendar-days"></i>14 June
                        {noticia.start ? format(new Date(noticia.start), "MMMM dd, yyyy") : 'April 21, 2024'}
                      </span>
                    </div>
                    <h4 className="postbox__title mb-20">
                      {noticia.title}
                    </h4>
                    <p>
                      {noticia.description}
                    </p>
                  </div>
                  <div className="postbox__content pb-20">
                    <div className="postbox__content-img mb-40 d-flex justify-content-between">
                      <img className="mr-30" src={blogImg2} alt="" />
                      <img src={blogImg3} alt="" />
                    </div>
                  </div>
                  <div className="postbox__details-share-wrapper">
                    <div className="row align-items-center">
                      <div className="col-xl-7 col-lg-7 col-md-7">
                        <div className="postbox__details-tag">
                          <span>Categorias:</span>
                          {Array.isArray(noticia.tags) && noticia.tags.length > 0 ? (
                            noticia.tags.map((tag, index) => (
                              <a key={index} href={`/news-details/${id}`}>{tag}</a>
                            ))
                          ) : (
                            <span>No hay categorías disponibles</span>
                          )}
                        </div>
                      </div>
                      <div className="col-xl-5 col-lg-5 col-md-5">
                        <div className="postbox__details-share text-lg-end">
                          <span>Share:</span>
                          <a href="https://facebook.com">
                            <i className="fab fa-facebook-f"></i>
                          </a>
                          <a href="https://instagram.com">
                            <i className="fa-brands fa-instagram"></i>
                          </a>
                          <a href="https://twitter.com">
                            <i className="fab fa-twitter"></i>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}; export default NewsDetailsMain;
