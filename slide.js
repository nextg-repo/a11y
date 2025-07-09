(()=>{
  class Page extends HTMLElement {
    constructor(){ super(); }
    set label(v){
      if(v) {
        this.setAttribute("label",v);
      } else {
        this.removeAttribute("label");
      }
    }
    get label(){
      return this.getAttribute("label");
    }

    static get observedAttributes(){
      return ["label"];
    }


    attributeChangedCallback(name, ov, nv){
      switch(name) {
        case "label":
          if(nv) {
            this.shadowRoot.querySelector(".page-inner").setAttribute("aria-label",nv);
          } else {
            this.shadowRoot.querySelector(".page-inner").removeAttribute("aria-label");
          }
        break;   
      }
    }

    connectedCallback(){
      this.shadow = this.attachShadow({mode:"open"});
      const template = document.createElement("template");
      
      template.innerHTML = `
      <style>
        :host { 
          display:flex; width:100%; height:100%;
          position:relative;
          align-items:center;
          justify-content:center;
        }
        .page-inner {
          height:90%; width:90%;
          position:relative;
          background-color:#fff;
        }
      </style>
      <div class="page-inner" part="inner" role="region" aria-roledescription="slide">
        <slot></slot>
      </div>`;
      this.shadow.appendChild(template.content.cloneNode(true));
    }
  }
  customElements.define("slide-page",Page);
  let isDesktop = true;
  let scrollTickTimer = 0;

  const getCurrentPage = ()=>{
    return parseInt(localStorage.getItem("introduce-a11y-last-page"))
  }
  let storedPage = getCurrentPage();
  
  if(isNaN(storedPage)) { localStorage.setItem("introduce-a11y-last-page",0); }
  const wrapper = document.querySelector(".page-wrapper");
  const pages = [...wrapper.querySelectorAll("slide-page")];
  pages.forEach((page,index)=>{ page.label = `${index+1} 페이지`; });
  let firstEntry = true;
  const screenChecker = matchMedia("(min-width:1025px)");
  window.addEventListener("resize",()=>{
    isDesktop = screenChecker.matches;
  });

  const setPage = (pageIndex, smooth=true)=>{
    if(pageIndex < 0) {
      pageIndex = pages.length-1;
      pages[pageIndex].scrollIntoView({block:"center",behavior:smooth ? "smooth" : "instant"})
    } else {
      pages[pageIndex].scrollIntoView({block:"center",behavior:smooth ? "smooth" : "instant"})
    }
    storedPage = pageIndex;
    inputPage.value = storedPage+1;
  }
  const previousPage = ()=>{
    setPage(storedPage-1 > -1 ? storedPage-1 : 0);
  }
  const nextPage = ()=>{
    setPage(storedPage+1 < pages.length ? storedPage+1 : pages.length-1)
  }
  window.addEventListener("wheel",(e)=>{
    
    if(isDesktop) {
      if(e.deltaY > 0) {
        clearTimeout(scrollTickTimer);
        scrollTickTimer = setTimeout(()=>{
          previousPage();
        },200)
      }
      else if(e.deltaY < 0) {
        clearTimeout(scrollTickTimer);
        scrollTickTimer = setTimeout(()=>{
          nextPage();
        },200)
      }
    }
  });

  const btnPreviousPage = document.getElementById("prev-slide");
  const btnNextPage = document.getElementById("next-slide");
  const btnMove = document.getElementById("move");
  const inputPage = document.getElementById("page-input");
  let val = "";
  inputPage.addEventListener("input",(e)=>{
    if(e.inputType !== "deleteContentBackward" && e.inputType !== "deleteContentForward") {
      if(!/[0-9]+/.test(e.data)) {
        e.currentTarget.value = val;
      } else {
        val = e.currentTarget.value;
      }
    } else {
      val = e.currentTarget.value;
    }
    const pageNo = parseInt(e.currentTarget.value);
    
    btnMove.disabled = isNaN(pageNo) || pageNo > pages.length || pageNo <= 0;

  });
  btnMove.addEventListener("click",()=>{
    const page = parseInt(inputPage.value);
    if ( !isNaN(page) ) {
      setPage(page-1,false);
    }
  });
  btnPreviousPage.addEventListener("click",()=>{
    previousPage();
  })
  btnNextPage.addEventListener("click",()=>{
    nextPage();
  })
  window.addEventListener("keydown",(e)=>{
    if(isDesktop && e.target.tagName !== "INPUT") {
      
      switch(e.code) {
        case "ArrowLeft":
          e.preventDefault();
          previousPage();
          break;
        case "ArrowRight":
          e.preventDefault();
          nextPage();
          break;
        case "Home":
          setPage(0,false)
          break;
        case "End":
          setPage(-1,false);
          break;
      }
    }
  });
  pages.forEach((page)=>{
    const io = new IntersectionObserver((intersections)=>{
      for(intersection of intersections){
        if (firstEntry) { 
          firstEntry = false;
          pages[storedPage].scrollIntoView({block:"center"})
          break;
        }
        if(intersection.intersectionRatio != 0 && isDesktop) {
          localStorage.setItem("introduce-a11y-last-page",
            pages.indexOf(intersection.target.getRootNode().host)
          );
          btnPreviousPage.disabled = getCurrentPage() == 0;
          btnNextPage.disabled = getCurrentPage() == pages.length-1;
        }
        inputPage.value = storedPage+1;
      }
    },{root:wrapper,threshold:1});
    io.observe(page.shadowRoot.querySelector(".page-inner"));
  });
  window.dispatchEvent(new Event("resize"));
})();